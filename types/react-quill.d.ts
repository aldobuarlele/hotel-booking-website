declare module 'react-quill' {
  import React from 'react';
  
  export interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    readOnly?: boolean;
    placeholder?: string;
    theme?: string;
    modules?: Record<string, any>;
    formats?: string[];
    bounds?: string | HTMLElement;
    scrollingContainer?: string | HTMLElement;
    onChange?: (value: string, delta?: any, source?: any, editor?: any) => void;
    onChangeSelection?: (range: any, source: any, editor: any) => void;
    onFocus?: (range: any, source: any, editor: any) => void;
    onBlur?: (previousRange: any, source: any, editor: any) => void;
    onKeyPress?: React.KeyboardEventHandler;
    onKeyDown?: React.KeyboardEventHandler;
    onKeyUp?: React.KeyboardEventHandler;
    preserveWhitespace?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export default class ReactQuill extends React.Component<ReactQuillProps> {}
}