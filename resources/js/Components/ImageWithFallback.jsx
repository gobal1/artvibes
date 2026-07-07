export const ImageWithFallback = ({ src, alt, className }) => {
    return <img src={src} alt={alt} className={className} onError={(e) => { e.target.src = 'https://via.placeholder.com/400'; }} />;
};