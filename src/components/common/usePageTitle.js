import { useEffect } from 'react';
import { useIntl } from 'react-intl';

const companyName = 'Tuleva';
const separator = ' – ';

export function usePageTitle(messageId) {
  const intl = useIntl();

  const hasTranslation = intl.messages && intl.messages[messageId];
  const translatedTitle = hasTranslation ? intl.formatMessage({ id: messageId }) : '';

  const finalTitle = translatedTitle ? `${translatedTitle}${separator}${companyName}` : companyName;

  useEffect(() => {
    document.title = finalTitle;
  }, [finalTitle]);
}
