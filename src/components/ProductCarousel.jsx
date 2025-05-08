import { Link } from 'react-router-dom';
import { Carousel, Image } from 'react-bootstrap';
import Message from './Message';
import { useGetTopProductsQuery } from '../slices/productsApiSlice';

const ProductCarousel = () => {
  const { data, isLoading, error } = useGetTopProductsQuery();

  // Debug logs
  console.log('API Response:', { data, isLoading, error });
  console.log('Products URL:', `${process.env.REACT_APP_API_URL || ''}/api/products/top`);

  // Handle loading state
  if (isLoading) {
    return <Message>Loading products...</Message>;
  }

  // Handle error state
  if (error) {
    console.error('Error fetching products:', error);
    return (
      <Message variant='danger'>
        {error?.data?.message || error?.error || 'Error loading products. Please try again later.'}
      </Message>
    );
  }

  // Handle empty data
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <Message>No products found.</Message>;
  }

  // Ensure we have an array of products
  const products = Array.isArray(data) ? data : data.products || [];

  return (
    <Carousel pause='hover' className='bg-primary mb-4'>
      {products.map((product, index) => (
        <Carousel.Item key={`${product._id}-${index}`}>
          <Link to={`/product/${product._id}`}>
            <Image 
              src={product.image} 
              alt={product.name} 
              fluid 
              onError={(e) => {
                console.error('Image failed to load:', product.image);
                e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
              }}
            />
            <Carousel.Caption className='carousel-caption'>
              <h2 className='text-white text-right'>
                {product.name} (${product.price})
              </h2>
            </Carousel.Caption>
          </Link>
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default ProductCarousel;
