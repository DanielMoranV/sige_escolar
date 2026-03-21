import apiClient from '../client';

export const siagieService = {
  async getSyncLog(anioEscolarId: string) {
    const { data } = await apiClient.get('/siagie/sync-log', { params: { anioEscolarId } });
    return data;
  },
  async confirmarSync(id: string, payload: { estado: string, observacion?: string }) {
    const { data } = await apiClient.patch(`/siagie/sync-log/${id}/confirmar`, payload);
    return data;
  }
};
