import { useApi } from '~/composables/useApi'

export interface MailLampiran {
  filename: string
  path?: string
  filebase64?: string
}

export interface SendMailPayload {
  subjek: string
  from_as: string
  to: string
  konten: string
  cc?: string
  bcc?: string
  lampiran?: MailLampiran[]
}

export const useMailService = () => {
  const { apiPost } = useApi()

  const sendMail = async (payload: SendMailPayload) => {
    return apiPost('/mail-service/send', payload, { skipCache: true } as any)
  }

  const sendMailBase64 = async (payload: SendMailPayload) => {
    return apiPost('/mail-service/send-base64', payload, { skipCache: true } as any)
  }

  const saveDraft = async (payload: SendMailPayload) => {
    return apiPost('/mail-service/draft', payload, { skipCache: true } as any)
  }

  return {
    sendMail,
    sendMailBase64,
    saveDraft,
  }
}
