import {
  ROUTE_TO_QUIZ,
} from './constants';

export function nextStep() {
}

export function routeToQuiz() {
  return { type: ROUTE_TO_QUIZ };
}

export function isRouteToQuiz(location) {
  if (location === '123') {
    return true;
  }
  return true;
}
