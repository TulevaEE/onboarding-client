const SAFARI_REFUSES_THE_ORIGIN_PRIVATE_FILE_SYSTEM_IN_PRIVATE_TABS = 'unknown transient reason';

type StorageWithFileSystem = { getDirectory?: () => Promise<unknown> };

export async function inAPrivateSafariTab(): Promise<boolean> {
  const storage = navigator.storage as StorageWithFileSystem | undefined;
  if (!storage?.getDirectory) {
    return false;
  }
  try {
    await storage.getDirectory();
    return false;
  } catch (refusal) {
    return (
      refusal instanceof Error &&
      refusal.message.includes(SAFARI_REFUSES_THE_ORIGIN_PRIVATE_FILE_SYSTEM_IN_PRIVATE_TABS)
    );
  }
}
