# react-set-props

**Store arbitrary state in redux with a similar API to setState**

## Installation

```shell
npm install @dabapps/react-set-props --save --save-exact
```

## Usage

### Connecting your component

```tsx
import { withSetProps, SetPropsProps } from '@dabapps/react-set-props';

interface ExternalProps {
  buttonText: string;
}

interface Props {
  count: number;
}

const MyComponent = ({buttonText, count, setProps}: ExternalProps & SetPropsProps<Props>) => (
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

### Props reducer

```tsx
import { propsReducer } from '@dabapps/react-set-props';

combineReducers({
  props: propsReducer
});
```
