/* eslint-disable @typescript-eslint/ban-ts-comment */
import { MutableRefObject, useEffect } from 'react';

export type AddressDetails = {
  aadress: string;
  paadress: string;
  lahiaadress: string;
  liik: string;
  kort_nr: string;
  orig_tunnus: string;
  un_tunnus: string;
  koodaadress: string;
  ehakmk: string;
  ehakov: string;
  ehak: string;
  kood4: string;
  kood5: string;
  kood6: string;
  kood7: string;
  kood8: string;
  kvaliteet: string;
  maakond: string;
  omavalitsus: string;
  asustusyksus: string;
  vaikekoht: string;
  liikluspind: string;
  nimi: string;
  aadress_nr: string;
  ads_oid: string;
  olek: string;
  hoone_ads_oid: string;
  adob_id: string;
  adr_id: string;
  asum: string;
  sihtnumber: string;
  poid: string[];
  x: string;
  y: string;
  b: number;
  l: number;
  primary: string;
};

export const useAddressLookupScript = (
  exisitingAddress: string | null,
  listener: (e: { detail: AddressDetails[] }) => unknown,
) => {
  useEffect(() => {
    const script = document.createElement('script');

    script.src = 'https://inaadress.maaamet.ee/inaadress/js/inaadress.min.js?d=20220510';

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const setupInput = (ref: MutableRefObject<unknown>, id: string) => {
    // @ts-ignore
    // eslint-disable-next-line no-param-reassign
    ref.current = new InAadress({
      container: id,
      mode: 3,
      ihist: '0',
      appartment: 1,
      lang: 'et',
    });
    if (exisitingAddress) {
      // @ts-ignore
      ref.current.setAddress(exisitingAddress);
    }
  };

  const destroyInput = (ref: MutableRefObject<unknown>) => {
    // @ts-ignore
    ref?.current?.searchInputDiv?.remove();
  };

  useEffect(() => {
    document.addEventListener('addressSelected', listener as unknown as EventListener);

    return () => {
      document.removeEventListener('addressSelected', listener as unknown as EventListener);
    };
  }, [listener]);

  return { setupInput, destroyInput };
};
