declare module 'react-gtm-module' {
  interface TagManagerArgs {
    gtmId: string;
  }

  const TagManager: {
    initialize: (args: TagManagerArgs) => void;
  };

  export default TagManager;
}
