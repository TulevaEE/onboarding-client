import { Shimmer } from '../common/shimmer/Shimmer';

export function AccountPageLoader() {
  return (
    <div data-testid="account-page-loader" aria-busy="true" className="mt-5">
      <div className="mb-5" style={{ maxWidth: '280px' }}>
        <Shimmer height={32} />
      </div>
      <div className="card card-secondary p-3 d-flex flex-column gap-3">
        <Shimmer height={64} />
        <Shimmer height={64} />
        <Shimmer height={64} />
      </div>
    </div>
  );
}
