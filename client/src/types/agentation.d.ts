/**
 * Type definitions for Agentation package
 *
 * Agentation is a visual feedback tool for AI coding agents that allows
 * developers to annotate UI elements and generate structured feedback.
 *
 * @see https://agentation.dev/
 */

declare module 'agentation' {
  /**
   * Annotation data structure containing element information
   */
  export interface Annotation {
    /** Element type (e.g., "button", "div", "input") */
    element: string;

    /** CSS selector path to the element */
    elementPath: string;

    /** Element's bounding box coordinates and dimensions */
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    /** Optional user-provided description of the annotation */
    description?: string;

    /** Timestamp when annotation was created */
    timestamp: number;
  }

  /**
   * Props for the Agentation component
   */
  export interface AgentationProps {
    /** Callback triggered when a new annotation is added */
    onAnnotationAdd?: (annotation: Annotation) => void;

    /** Whether to automatically copy annotations to clipboard (default: true) */
    copyToClipboard?: boolean;

    /** Optional demo annotations to display */
    demoAnnotations?: Annotation[];
  }

  /**
   * Main Agentation component
   *
   * Renders a toolbar overlay that enables UI element annotation in development
   */
  export function Agentation(props: AgentationProps): JSX.Element;
}
