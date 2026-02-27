import { ref } from "vue";

// Синглтон — один экземпляр на всё приложение
const newCount = ref(0);

export function useTicketsBadge() {
  return { newCount };
}
