import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { v4 as uuid } from 'uuid';

export const STORE_KEY = 'props';
const SET_PROPS = 'SET_PROPS';
const CLEAR_PROPS = 'CLEAR_PROPS';
const SET_PROPS_SECRET_KEY = 'SET_PROPS_SECRET_KEY';

type Component<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

export interface StringKeyedObject {
  [index: string]: any;
}

export interface Payload {
  id: string;
  props?: StringKeyedObject;
}

export interface SetPropsAction {
  type: string;
  payload: Payload;
}

interface ISetPropsParentProps<Props> {
  id: string;
  setProps(props: Partial<Props>): void;
}

export interface StoreProps {
  props?: StringKeyedObject & {
    secretKey: string;
  };
}

interface InternalSetPropsProps<Props> {
  setProps(id: string, props: Partial<Props>): void;
  clearProps(id: string): void;
}

export type SetPropsProps<Props> = {
  setProps(props: Partial<Props>): void;
  dispatch(): Dispatch<any>;
} & Props;

function setProps<Props>(id: string, props: Partial<Props>) {
  return {
    type: SET_PROPS,
    payload: {
      id,
      props,
    },
  };
}

function clearProps(id: string) {
  return {
    type: CLEAR_PROPS,
    payload: id,
  };
}

export function propsReducer(
  state: StoreProps[typeof STORE_KEY] = { secretKey: SET_PROPS_SECRET_KEY },
  action: SetPropsAction
): StoreProps[typeof STORE_KEY] {
  switch (action.type) {
    case SET_PROPS:
      const previous = state[action.payload.id];

      return {
        ...state,
        [action.payload.id]: {
          ...previous,
          ...action.payload.props,
        },
      };
    case CLEAR_PROPS:
      const { [action.payload.id]: cleared, ...rest } = state;

      return {
        ...rest,
      };
    default:
      return state;
  }
}

export function withSetProps<
  Props extends StringKeyedObject,
  ExternalProps extends StringKeyedObject = {}
>(getInitialProps: (props: ExternalProps) => Props) {
  const unconnected = connect(
    (
      state: StoreProps,
      parentProps: StringKeyedObject & ISetPropsParentProps<Props>
    ): Props & ExternalProps => {
      const props = state[STORE_KEY];

      // Due to a generics issue TypeScript doesn't think props is an object here so we have to cast
      const { id, ...externalProps } = parentProps;

      if (!props || props.secretKey !== SET_PROPS_SECRET_KEY) {
        throw new Error(
          'No props reducer found in store. Note: must be called "props".'
        );
      }

      const storeProps = props[parentProps.id];

      return {
        ...storeProps,
        ...externalProps,
      };
    }
  );

  return (Component: Component<Props>): Component<ExternalProps> => {
    const Connected = unconnected(Component);

    return connect<{}, InternalSetPropsProps<Props>, ExternalProps>(
      (state: {}, props: ExternalProps) => {
        return props;
      },
      { setProps, clearProps }
    )(
      class SetPropsWrapper extends React.PureComponent<
        StringKeyedObject & InternalSetPropsProps<Props>,
        Props
      > {
        private id: string;

        public constructor(
          inputProps: ExternalProps & InternalSetPropsProps<Props>
        ) {
          super(inputProps);

          this.id = uuid();

          this.boundSetProps = this.boundSetProps.bind(this);
        }

        public componentWillMount() {
          const { setProps, clearProps, ...externalProps } = this.props;

          // TODO: Remove casts when TS support destructing extended types
          this.props.setProps(
            this.id,
            getInitialProps(externalProps as Readonly<ExternalProps>)
          );
        }

        public componentWillUnmount() {
          this.props.clearProps(this.id);
        }

        public render() {
          const { setProps, clearProps, ...remainingProps } = this.props;

          // TODO: Remove casts when TS support destructing extended types
          return (
            <Connected
              {...remainingProps as Readonly<ExternalProps>}
              id={this.id}
              setProps={this.boundSetProps}
            />
          );
        }

        private boundSetProps(props: Partial<Props>) {
          this.props.setProps(this.id, props);
        }
      }
    );
  };
}
