const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./auth');

// Função auxiliar para obter início e fim do dia
function getStartAndEndOfDay(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// Função auxiliar para obter início e fim da semana
function getStartAndEndOfWeek(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Domingo
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// Rota para obter métricas do dashboard
router.get('/metrics', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    console.log('[Dashboard] Iniciando busca de métricas...');
    const today = new Date();
    const { start: dayStart, end: dayEnd } = getStartAndEndOfDay(today);
    const { start: weekStart, end: weekEnd } = getStartAndEndOfWeek(today);

    console.log('[Dashboard] Buscando faturamento do dia...');
    // 1. Faturamento do dia
    const dailyRevenue = await prisma.pedido.aggregate({
      where: {
        criadoEm: {
          gte: dayStart,
          lte: dayEnd
        },
        status: {
          in: ['being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered']
        }
      },
      _sum: {
        precoTotal: true
      }
    });

    // 2. Número de vendas do dia
    const dailySales = await prisma.pedido.count({
      where: {
        criadoEm: {
          gte: dayStart,
          lte: dayEnd
        },
        status: {
          in: ['being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered']
        }
      }
    });

    // 3. Ticket médio do dia
    const dailyTicketAverage = dailySales > 0 ? 
      (parseFloat(dailyRevenue._sum.precoTotal || 0) / dailySales).toFixed(2) : 0;

    // 4. Vendas da semana (por dia)
    const weeklyStats = await prisma.pedido.groupBy({
      by: ['criadoEm'],
      where: {
        criadoEm: {
          gte: weekStart,
          lte: weekEnd
        },
        status: {
          in: ['being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered']
        }
      },
      _sum: {
        precoTotal: true
      },
      _count: {
        id: true
      }
    });

    // 5. Produtos mais vendidos
    const topProducts = await prisma.item_pedido.groupBy({
      by: ['produtoId'],
      where: {
        pedido: {
          criadoEm: {
            gte: weekStart,
            lte: weekEnd
          },
          status: {
            in: ['being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered']
          }
        }
      },
      _sum: {
        quantidade: true
      },
      _count: {
        produtoId: true
      },
      orderBy: {
        _sum: {
          quantidade: 'desc'
        }
      },
      take: 5
    });

    // Buscar detalhes dos produtos mais vendidos e garantir campo 'name'
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.produto.findUnique({
          where: { id: item.produtoId },
          select: { id: true, nome: true, preco: true }
        });
        return {
          id: product.id,
          name: product.nome, // garantir campo 'name' para o frontend
          preco: product.preco,
          quantitySold: item._sum.quantidade,
          orderCount: item._count.produtoId
        };
      })
    );

    // 6. Faturamento da semana
    const weeklyRevenue = await prisma.pedido.aggregate({
      where: {
        criadoEm: {
          gte: weekStart,
          lte: weekEnd
        },
        status: {
          in: ['being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered']
        }
      },
      _sum: {
        precoTotal: true
      }
    });

    // 7. Total de pedidos pendentes
    const pendingOrders = await prisma.pedido.count({
      where: {
        status: {
          in: ['pending_payment', 'being_prepared', 'ready_for_pickup', 'on_the_way']
        }
      }
    });

    // 8. Status dos pedidos de hoje
    const todayOrdersStatus = await prisma.pedido.groupBy({
      by: ['status'],
      where: {
        criadoEm: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      _count: {
        id: true
      }
    });

    // 9. Comparação com ontem
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const { start: yesterdayStart, end: yesterdayEnd } = getStartAndEndOfDay(yesterday);

    const yesterdayRevenue = await prisma.pedido.aggregate({
      where: {
        criadoEm: {
          gte: yesterdayStart,
          lte: yesterdayEnd
        },
        status: {
          in: ['being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered']
        }
      },
      _sum: {
        precoTotal: true
      }
    });

    const yesterdayOrders = await prisma.pedido.count({
      where: {
        criadoEm: {
          gte: yesterdayStart,
          lte: yesterdayEnd
        },
        status: {
          in: ['being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered']
        }
      }
    });

    // Calcular variações percentuais
    const revenueChange = yesterdayRevenue._sum.precoTotal ? 
      (((parseFloat(dailyRevenue._sum.precoTotal || 0) - parseFloat(yesterdayRevenue._sum.precoTotal || 0)) / parseFloat(yesterdayRevenue._sum.precoTotal || 0)) * 100).toFixed(1) : 0;
    
    const ordersChange = yesterdayOrders ? 
      (((dailySales - yesterdayOrders) / yesterdayOrders) * 100).toFixed(1) : 0;

    // 10. Preparar dados da semana para gráfico
    const weeklyData = [];
    const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + i);
      const { start: dayStart, end: dayEnd } = getStartAndEndOfDay(currentDay);
      
      const dayStats = await prisma.pedido.aggregate({
        where: {
          criadoEm: {
            gte: dayStart,
            lte: dayEnd
          },
          status: {
            in: ['being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered']
          }
        },
        _sum: {
          precoTotal: true
        },
        _count: {
          id: true
        }
      });
      
      weeklyData.push({
        day: daysOfWeek[i],
        revenue: parseFloat(dayStats._sum.precoTotal || 0),
        orders: dayStats._count.id || 0,
        date: currentDay.toISOString().split('T')[0]
      });
    }

    res.json({
      daily: {
        revenue: parseFloat(dailyRevenue._sum.precoTotal || 0),
        sales: dailySales,
        ticketAverage: parseFloat(dailyTicketAverage),
        revenueChange: parseFloat(revenueChange),
        ordersChange: parseFloat(ordersChange)
      },
      weekly: {
        revenue: parseFloat(weeklyRevenue._sum.precoTotal || 0),
        data: weeklyData
      },
      topProducts: topProductsWithDetails,
      pendingOrders,
      todayOrdersStatus: todayOrdersStatus.map(status => ({
        status: status.status,
        count: status._count.id
      }))
    });

  } catch (error) {
    console.error('[Dashboard] Erro ao buscar métricas do dashboard:');
    console.error('[Dashboard] Error name:', error.name);
    console.error('[Dashboard] Error message:', error.message);
    console.error('[Dashboard] Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

// Rota para obter histórico de vendas (últimos 30 dias)
router.get('/sales-history', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesHistory = [];
    
    for (let i = 0; i < 30; i++) {
      const currentDay = new Date(thirtyDaysAgo);
      currentDay.setDate(thirtyDaysAgo.getDate() + i);
      const { start: dayStart, end: dayEnd } = getStartAndEndOfDay(currentDay);
      
      const dayStats = await prisma.pedido.aggregate({
        where: {
          criadoEm: {
            gte: dayStart,
            lte: dayEnd
          },
          status: {
            in: ['being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered']
          }
        },
        _sum: {
          precoTotal: true
        },
        _count: {
          id: true
        }
      });
      
      salesHistory.push({
        date: currentDay.toISOString().split('T')[0],
        revenue: parseFloat(dayStats._sum.precoTotal || 0),
        orders: dayStats._count.id || 0
      });
    }

    res.json(salesHistory);
  } catch (error) {
    console.error('Erro ao buscar histórico de vendas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;