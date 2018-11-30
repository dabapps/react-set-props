# react-set-props

[![Build Status](https://travis-ci.org/dabapps/react-set-props.svg?branch=master)](https://travis-ci.org/dabapps/react-set-props)

**Store arbitrary state in redux with a similar API to setState**

## Installation

```shell
npm install @dabapps/react-set-props --save --save-exact
```

## Usage

### TypeScript

#### Connecting your component

```tsx
import { withSetProps, SetPropsInterface } from '@dabapps/react-set-props';

interface ExternalProps {
  buttonText: string;
}

interface Props {
  count: number;
}

const MyComponent = ({buttonText, count, setProps}: ExternalProps & SetPropsInterface<Props>) => (
  <p>
    Count: {count}
    <button onClick={() => setProps({count: count + 1})}>
      {buttonText}
    </button>
  </p>
);

const getInitialProps = (props: ExternalProps) => ({
  count: 0
});

export default withSetProps<Props, ExternalProps>(getInitialProps)(MyComponent);
```

#### Props reducer

```tsx
import { setPropsReducer } from '@dabapps/react-set-props';

combineReducers({
  setPropsReducer
});
```

### Javascript

#### Connecting your component

```js
import { withSetProps } from '@dabapps/react-set-props';

const MyComponent = ({buttonText, count, setProps}) => (
  <p>
    Count: {count}
    <button onClick={() => setProps({count: count + 1})}>
      {buttonText}
    </button>
  </p>
);

const getInitialProps = (props) => ({
  count: 0
});

export default withSetProps(getInitialProps)(MyComponent);
```

#### Props reducer

```js
import { setPropsReducer } from '@dabapps/react-set-props';

combineReducers({
  setPropsReducer
});
```

## Code of conduct

For guidelines regarding the code of conduct when contributing to this repository please review [https://www.dabapps.com/open-source/code-of-conduct/](https://www.dabapps.com/open-source/code-of-conduct/)
