import { SmartIdLoginCallback } from '../components/common/apiModels';
import { TranslationKey } from '../components/translations';

declare global {
  interface Window {
    smartIdCallback?: SmartIdLoginCallback;
    handoverToken?: string;
  }

  namespace FormatjsIntl {
    interface Message {
      ids: TranslationKey;
    }
  }
}
