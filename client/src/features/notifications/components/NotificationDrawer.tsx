export const NotificationDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return <div className="fixed inset-y-0 right-0 w-80 bg-background border-l p-4 z-[100]">Notifications Mock <button onClick={onClose}>Close</button></div>;
};
