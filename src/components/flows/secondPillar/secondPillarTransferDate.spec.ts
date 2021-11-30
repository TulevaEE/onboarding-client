import secondPillarTransferDate from './secondPillarTransferDate';

describe('secondPillarTransferDate', () => {
  const mayTransferDate = new Date('2021-05-01');
  const septemberTransferDate = new Date('2021-09-01');
  const januaryTransferDate = new Date('2022-01-01');

  it('returns may when date before april', () => {
    Date.now = jest.fn().mockReturnValue(new Date('2021-02-25'));
    expect(secondPillarTransferDate()).toEqual(mayTransferDate);
  });

  it('returns september when date in april', () => {
    Date.now = jest.fn().mockReturnValue(new Date('2021-04-01'));
    expect(secondPillarTransferDate()).toEqual(septemberTransferDate);
  });

  it('returns january when date after august', () => {
    Date.now = jest.fn().mockReturnValue(new Date('2021-11-30'));
    expect(secondPillarTransferDate()).toEqual(januaryTransferDate);
  });
});
