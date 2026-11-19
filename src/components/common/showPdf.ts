import download from 'downloadjs';

const PDF = 'application/pdf';

export const showPdf = (pdf: Blob, fileName: string) => {
  const pdfAddress = URL.createObjectURL(new Blob([pdf], { type: PDF }));
  if (!window.open(pdfAddress, '_blank')) {
    URL.revokeObjectURL(pdfAddress);
    download(pdf, fileName, PDF);
  }
};
