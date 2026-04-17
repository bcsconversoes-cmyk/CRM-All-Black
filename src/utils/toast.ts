type ToastType = 'success' | 'error' | 'info';

interface ToastEvent extends CustomEvent {
    detail: {
        message: string;
        type: ToastType;
    };
}

export const toast = {
    show: (message: string, type: ToastType = 'info') => {
        const event = new CustomEvent('app-toast', {
            detail: { message, type }
        });
        window.dispatchEvent(event);
    },
    success: (message: string) => toast.show(message, 'success'),
    error: (message: string) => toast.show(message, 'error'),
    info: (message: string) => toast.show(message, 'info'),
};
