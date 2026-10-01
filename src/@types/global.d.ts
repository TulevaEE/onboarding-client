import { SmartIdLoginCallback } from '../components/common/apiModels';
import { TranslationKey } from '../components/translations';

declare global {
  interface Window {
    smartIdCallback?: SmartIdLoginCallback;
  }

  namespace FormatjsIntl {
    interface Message {
      ids: TranslationKey;
    }
  }
}
