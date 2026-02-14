export const mockAPI = {
  // Simule suas chamadas API aqui
  getOrders: () => Promise.resolve([]),
  createOrder: (data) => Promise.resolve({ id: Date.now(), ...data }),
  // etc
}