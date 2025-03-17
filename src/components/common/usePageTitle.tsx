import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { TranslationKey } from '../translations';

const companyName = 'Tuleva';
const separator = ' – ';

export function usePageTitle(messageId: TranslationKey) {
  const intl = useIntl();
  const location = useLocation();

  useEffect(() => {
    const previousTitle = document.title;

    const hasTranslation = intl.messages && intl.messages[messageId];
    const translatedTitle = hasTranslation ? intl.formatMessage({ id: messageId }) : '';
    const finalTitle = translatedTitle
      ? `${translatedTitle}${separator}${companyName}`
      : companyName;
    document.title = finalTitle;

    return () => {
      document.title = previousTitle;
    };
  }, [intl, messageId, location]);
}
