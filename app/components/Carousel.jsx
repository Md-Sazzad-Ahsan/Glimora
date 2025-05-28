'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Mousewheel, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Card, CardHeader, CardContent, CardTitle } from '@/app/components/Card';
import Image from 'next/image';
import { useState } from 'react';

const Carousel = ({ title, items, getImageUrl, formatRating, getReleaseYear, formatCast, onTimePeriodChange }) => {
  const [timePeriod, setTimePeriod] = useState('day');

  const handleTimePeriodChange = () => {
    setTimePeriod(timePeriod === 'day' ? 'week' : 'day');
    onTimePeriodChange(timePeriod === 'day' ? 'week' : 'day');
  };

  return (
    <div className="carousel-container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-6 md:px-5">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="relative">
          <div className="flex items-center bg-gray-200 rounded-full overflow-hidden">
            <button 
              onClick={handleTimePeriodChange}
              className={`px-3 py-1.5 md:py-1 font-medium text-xs transition-all duration-200 ease-in-out ${
                timePeriod === 'day' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-transparent text-gray-600'
              }`}
            >
              TODAY
            </button>
            <button 
              onClick={handleTimePeriodChange}
              className={`px-3 py-1.5 md:py-1 font-medium text-xs transition-all duration-200 ease-in-out ${
                timePeriod === 'day' 
                  ? 'bg-transparent text-gray-600' 
                  : 'bg-orange-500 text-white'
              }`}
            >
              WEEK
            </button>
          </div>
        </div>
      </div>
      <div className="text-center mb-6">
        <div className="relative">
          {/* <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div> */}
        </div>
      </div>
      
      <Swiper
        modules={[Navigation, Pagination, Mousewheel, Autoplay]}
        spaceBetween={20}
        slidesPerView={3}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
          autohide: true,
          hideOnClick: true,
          hideOnLeave: true,
          hideAfter: 3000,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
          renderBullet: (index, className) => {
            return `<span class="${className} swiper-pagination-bullet-custom"></span>`;
          },
        }}
        mousewheel={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          320: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
        }}
        className="swiper"
      >
        {items.map((item) => (
          <SwiperSlide key={item.id}>
            <div className="w-full">
              <Card className="h-full">
                <CardHeader>
                  <div className="relative aspect-video">
                    {item.backdrop_path ? (
                      <Image
                        src={getImageUrl(item.backdrop_path)}
                        alt={item.title || item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400">No image available</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-start">
                    <CardTitle className="text-2xl font-bold">
                      {item.title || item.name} ({getReleaseYear(item.release_date || item.first_air_date)})
                    </CardTitle>
                  </div>
                  <div className="flex items-center text-base text-gray-700 dark:text-white mb-3">
                    <span className="text-orange-500">⭐</span>
                    <span className="ml-1 font-semibold">TMDB:</span>
                    <span className="ml-1 font-semibold">
                      {formatRating(item.vote_average)}/10
                    </span>
                  </div>
                  {item.cast && item.cast.length > 0 && (
                    <div className="text-base text-gray-600 dark:text-gray-300 mb-3">
                      <span className="font-semibold text-gray-700 dark:text-white">Cast:</span> {formatCast(item.cast)}
                    </div>
                  )}
                  <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.overview ? item.overview.slice(0, 100) + '...' : 'No description available'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Carousel;
