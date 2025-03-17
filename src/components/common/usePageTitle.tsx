import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { TranslationKey } from '../translations';

const companyName = 'Tuleva';
const separator = ' – ';

export function usePageTitle(messageId: TranslationKey) {
  const intl = useIntl();

  useEffect(() => {
    const hasTranslation = intl.messages && intl.messages[messageId];
    const translatedTitle = hasTranslation ? intl.formatMessage({ id: messageId }) : '';

    const finalTitle = translatedTitle
      ? `${translatedTitle}${separator}${companyName}`
      : companyName;
    document.title = finalTitle;
  }, []);
}
