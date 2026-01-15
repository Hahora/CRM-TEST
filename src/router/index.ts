import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import UnderDevelopment from "../views/UnderDevelopment.vue";
import Sales from "../views/Sales.vue";
import Clients from "../views/Clients.vue";
import Visits from "../views/Visits.vue";
import Reports from "@/views/Reports.vue";
import Mailings from "@/views/Mailings.vue";
import Tickets from "@/views/Tickets.vue";
import TicketChat from "@/views/TicketChat.vue";
import LoginPage from "@/views/LoginPage.vue";
import { useAuth } from "@/composables/useAuth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: {
        title: "Вход",
        requiresAuth: false,
      },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: Dashboard,
      meta: {
        title: "Дашборд",
        requiresAuth: true,
      },
    },
    {
      path: "/sales",
      name: "sales",
      component: Sales,
      meta: {
        title: "Продажи",
        requiresAuth: true,
      },
    },
    {
      path: "/clients",
      name: "clients",
      component: Clients,
      meta: {
        title: "Клиенты",
        requiresAuth: true,
      },
    },
    {
      path: "/visits",
      name: "Visits",
      component: () => import("@/views/Visits.vue"),
      meta: {
        requiresAuth: true,
        title: "Посещения",
      },
    },
    // {
    //   path: "/visits/:id",
    //   name: "VisitDetails",
    //   component: () => import("@/views/VisitDetails.vue"),
    //   meta: {
    //     requiresAuth: true,
    //     title: "Детали посещения",
    //   },
    // },
    // {
    //   path: "/visits/create",
    //   name: "CreateVisit",
    //   component: () => import("@/views/CreateVisit.vue"),
    //   meta: {
    //     requiresAuth: true,
    //     title: "Новое посещение",
    //   },
    // },
    {
      path: "/reports",
      name: "reports",
      component: Reports,
      meta: {
        title: "Отчеты",
        requiresAuth: true,
      },
    },
    {
      path: "/mailings",
      name: "mailings",
      component: Mailings,
      meta: {
        title: "Рассылки",
        requiresAuth: true,
      },
    },
    {
      path: "/tickets",
      name: "tickets",
      component: Tickets,
      meta: {
        title: "Тикеты",
        requiresAuth: true,
      },
    },
    {
      path: "/tickets/:id",
      name: "ticket",
      component: TicketChat,
      meta: {
        title: "Тикет",
        requiresAuth: true,
      },
    },
    {
      path: "/users",
      name: "users",
      component: UnderDevelopment,
      props: {
        title: "Пользователи",
        description: "Модуль управления пользователями находится в разработке",
      },
      meta: {
        title: "Пользователи",
        requiresAuth: true,
      },
    },
    {
      path: "/settings",
      name: "settings",
      component: UnderDevelopment,
      props: {
        title: "Настройки",
        description: "Настройки системы находятся в разработке",
      },
      meta: {
        title: "Настройки",
        requiresAuth: true,
      },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/dashboard",
    },
  ],
});

// Navigation Guard для проверки авторизации
router.beforeEach(async (to, from, next) => {
  // Устанавливаем title страницы
  document.title = to.meta.title ? `${to.meta.title} - CRM` : "CRM";

  const { checkAuth, isAuthenticated } = useAuth();

  // Проверяем авторизацию только если пользователь не авторизован
  if (!isAuthenticated.value) {
    const isAuth = await checkAuth();

    // Если маршрут требует авторизации, а пользователь не авторизован
    if (to.meta.requiresAuth && !isAuth) {
      next("/login");
      return;
    }
  }

  // Если пользователь авторизован и пытается зайти на страницу логина
  if (to.path === "/login" && isAuthenticated.value) {
    next("/dashboard");
    return;
  }

  // Если маршрут требует авторизации и пользователь авторизован
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next("/login");
    return;
  }

  next();
});

export default router;
