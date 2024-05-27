import { TranslationKey } from './components/translations';

declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: TranslationKey;
    }
  }
}
