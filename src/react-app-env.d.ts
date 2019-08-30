// eslint-disable-next-line spaced-comment
/// <reference types="react-scripts" />

declare module 'retranslate' {
  interface MessageProps {
    children: React.ReactNode;
    params?: Record<string, React.ReactNode>;
  }

  export const withTranslations: (component: React.ComponentType<any>) => React.ComponentType<any>;
  export const Message: React.FC<MessageProps>;
}
