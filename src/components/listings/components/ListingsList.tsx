import { Link } from 'react-router-dom';
import styles from './ListingsList.module.scss';
import { Listing } from '../../common/apiModels/listings';

export const ListingsList = () => {
  const listings: Listing[] = [];

  if (listings.length === 0) {
    return (
      <div className={styles.noListingsContainer}>
        <div className="text-secondary">Aktiivseid kuulutusi ei ole</div>
        <Link to="/capital/listings/add" className="mt-4 btn btn-primary">
          + Lisan kuulutuse
        </Link>
      </div>
    );
  }

  return null;
};
