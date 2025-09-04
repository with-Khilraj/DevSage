/**
 * UI Components Index
 * Centralized exports for all UI components
 */

// Core UI Components
export { default as Button, ButtonGroup, IconButton, FloatingActionButton } from './Button';
export { default as Input, Textarea } from './Input';
export { default as Card, CardHeader, CardBody, CardFooter, MetricCard, FeatureCard, CardGrid } from './Card';
export { default as Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal, AlertModal } from './Modal';
export { default as Checkbox, CheckboxGroup } from './Checkbox';
export {
    default as Badge,
    StatusBadge,
    PriorityBadge,
    CountBadge,
    TagBadge,
    BadgeGroup,
    NotificationBadge
} from './Badge';

// Layout Components
export {
    default as MainLayout,
    MainContent,
    PageContainer,
    Section,
    LoadingLayout,
    ErrorLayout
} from '../layout/MainLayout';
export { default as Header } from '../layout/Header';
export { default as Sidebar } from '../layout/Sidebar';

// Loading Components
export {
    Spinner,
    Skeleton,
    CardSkeleton,
    TableSkeleton,
    LoadingOverlay,
    InlineLoading,
    ButtonLoading,
    ProgressBar
} from './Loading';

// Multimodal Component
export { default as MultimodalInput } from '../MultimodalInput';