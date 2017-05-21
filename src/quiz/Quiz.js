import React, { PropTypes as Types } from 'react';
import { Message } from 'retranslate';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { nextStep } from './actions';

// import './Quiz.scss';

export const Quiz = ({
  onNextStep,
}) => (
  <div className="row">
    <div className="col-12 mt-5 px-0">
      <h2 className="mt-5">
        <Message>Take a quiz!</Message>
      </h2>

      <div>
        <h3>1/5</h3>
        <section className="container">
          <div className="ask">
            <h1>1. If you retire today, how much would you need every month?</h1>
            <input type="text" name="amount" /> €
          </div>
          <div className="ask2">
            <h1>2. What % is that of my current salary?</h1>
            <button type="button" className="btn btn-lg btn-default correct-ans">
              20% - 30%</button><br />
            <button type="button" className="btn btn-lg btn-default correct-ans">
              30% - 50%</button><br />
            <button type="button" className="btn btn-lg btn-default correct-ans">
              50% - 70%</button><br />
            <button type="button" className="btn btn-lg btn-default correct-ans">
              70% - 100%</button>
          </div>
        </section>

        <h3>2/5</h3>
        <section className="container">
          <div className="ask">
            <h1>How many more years do you want to keep working?</h1>
            <button type="button" className="btn btn-lg btn-default correct-ans">10</button><br />
            <button type="button" className="btn btn-lg btn-default correct-ans">20</button><br />
            <button type="button" className="btn btn-lg btn-default correct-ans">40</button><br />
            <button type="button" className="btn btn-lg btn-default correct-ans">30</button>
          </div>
        </section>

        <h3>3/5</h3>
        <section className="container">
          <div className="ask">
            <h1>How much do you think you have in your 2nd pillar pension fund?</h1>
            <button type="button" className="btn btn-lg btn-default incorrect-ans">
              2500</button><br />
            <button type="button" className="btn btn-lg btn-default correct-ans">5000</button><br />
            <button type="button" className="btn btn-lg btn-default incorrect-ans">7500</button>
          </div>
          <div className="correct">
            <h2>Right!</h2>
            <p><img
              src="img/euros-fund.png"
              alt="asd" width="450px"
            />
              Every month, 2% of your salary (+ 4% from the state)
               or 90 euros goes to your pension fund.
              You may not notice it since it is deducted before your salary is paid.</p>
          </div>
          <div className="incorrect">
            <h2>Not quite</h2>
            <p><img
              src="img/euros-fund.png"
              width="450px"
              alt="asd"
            />
              Every month, 2% of your salary
              (+ 4% from the state) or 90 euros goes to your pension fund.
              You may not notice it since it is deducted before your salary is paid.</p>
          </div>
        </section>

        <h3>4/5</h3>
        <section className="container">
          <div className="ask">
            <h1>Your contributions go today to Swedbank K3 pension fund.
              What is this funds investment strategy? </h1>
            <button
              type="button"
              className="btn btn-lg btn-default incorrect-ans"
            >Conservative</button><br />
            <button
              type="button"
              className="btn btn-lg btn-default correct-ans"
            >Balanced</button><br />
            <button
              type="button"
              className="btn btn-lg btn-default incorrect-ans"
            >Progressive</button><br />
            <button
              type="button"
              className="btn btn-lg btn-default incorrect-ans"
            >Agressive</button>
          </div>
          <div className="correct">
            <h2>Right!</h2>
            <p><img
              src="img/fund-strategy.png"
              width="320px"
              alt="asd"
            />
              Strategy shows how much of your fund`s
               assets can be invested in shares.
               That share is 0% in conservative funds up until
              75% in aggressive funds.<br /><br />Historically,
              shares have provided 5% higher annyal
              return than bonds, but there have been
              periods when shares have had negative returns.
              Long investment period allows you to
              accept more risk and therefore most
              analysts would recommend you to
              chose aggressive strategy.</p>
          </div>
          <div className="incorrect">
            <h2>Not quite.</h2>
            <p><img
              src="img/fund-strategy.png"
              width="320px"
              alt="asd"
            />Strategy shows how much of your fund`s assets
               can be invested in shares.
              That share is 0% in conservative funds
              up until 75% in aggressive funds.<br /><br />
              Historically, shares have provided 5%
              higher annyal return than bonds,
              but there have been periods when
              shares have had negative returns.
              Long investment period allows you
              to accept more risk and therefore most
              analysts would recommend you to
              chose aggressive strategy.</p>
          </div>
        </section>

        <h3>5/5</h3>
        <section className="container">
          <div className="ask">
            <h1>How much do you pay monthly to your manager?</h1>
            <button
              type="button"
              className="btn btn-lg btn-default incorrect-ans"
            >1 euro</button><br />
            <button
              type="button"
              className="btn btn-lg btn-default correct-ans"
            >2 euros</button><br />
            <button
              type="button"
              className="btn btn-lg btn-default incorrect-ans"
            >3 euros</button><br />
            <button
              type="button"
              className="btn btn-lg btn-default incorrect-ans"
            >4 euros</button>
          </div>
          <div className="correct">
            <h2>Right!</h2>
            <p><img
              src="img/fee-manager.png"
              width="400px"
              alt="asd"
            />
              Your fund charges 0.92% of your fund value every year.
              This means that this month, 3 euros will be deducted
              from your fund value. In the cheapest fund, you
              would pay this month 1 euro and in the most expensive, 4 euros.
              Next month the cost will increase as you
              contribute more money to your fund.</p>
          </div>
          <div className="incorrect">
            <h2>Not quite.</h2>
            <p><img
              src="img/fee-manager.png"
              width="400px"
              alt="asd"
            />
              Your fund charges 0.92% of your fund value every year.
              This means that this month, 3 euros will
              be deducted from your fund value.
              In the cheapest fund, you would pay
              this month 1 euro and in the most expensive,
              5 euros. Next month the cost will
              increase as you contribute more money to your fund.</p>
          </div>
        </section>
      </div>

      <Link className="btn btn-primary mt-4 profile-link" to="/account">
        <Message>some link</Message>
      </Link>
      <button className="btn btn-secondary text-center" onClick={onNextStep}>
        <Message>Next step</Message>
      </button>
    </div>
  </div>
);

const noop = () => null;

Quiz.defaultProps = {
  onNextStep: noop,
};

Quiz.propTypes = {
  onNextStep: Types.func,
};

const mapStateToProps = state => ({
  temp: !state,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onNextStep: nextStep,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Quiz);
