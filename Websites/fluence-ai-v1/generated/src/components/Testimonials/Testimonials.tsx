'use client';

import React from 'react';

export interface TestimonialsProps {
  className?: string;
}

export function Testimonials({ className }: TestimonialsProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Cloud background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0
      }}>
        <img
          src="https://framerusercontent.com/images/vkYLURkIQB3wgCJUD4m2MGdbKg.png"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '100px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          padding: '6px 14px',
          backgroundColor: 'rgb(255, 255, 255)',
          borderRadius: '999px',
          boxShadow: 'rgba(0, 0, 0, 0.07) 0px 2px 5px 0px',
          marginBottom: '24px'
        }}>
          <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>
            WALL OF LOVE
          </p>
        </div>

        <h2 style={{
          fontFamily: "'General Sans', sans-serif",
          fontSize: '60px',
          fontWeight: '500',
          lineHeight: '66px',
          textAlign: 'center',
          color: 'rgb(27, 12, 37)',
          marginBottom: '60px'
        }}>
          What they're Saying
        </h2>

        {/* Testimonial Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '40px',
          marginBottom: '60px'
        }}>
          {/* Left Arrow */}
          <button style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgb(255, 255, 255)',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          {/* Card */}
          <div style={{
            maxWidth: '700px',
            backgroundColor: 'rgb(27, 12, 37)',
            borderRadius: '16px',
            padding: '40px',
            color: 'white'
          }}>
            <p style={{
              fontFamily: "'General Sans', sans-serif",
              fontSize: '24px',
              fontWeight: '500',
              lineHeight: '36px',
              marginBottom: '32px'
            }}>
              "Fluence AI has revolutionized the way we process data. The seamless integration and advanced analytics tools have saved us countless hours and improved our decision-making"
            </p>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                overflow: 'hidden'
              }}>
                <img src="https://framerusercontent.com/images/GlTpL8aVZnGhBJLFTLiPjKV3M.jpg" alt="Sarah J." style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
              <div>
                <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500'}}>Sarah J.</p>
                <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', opacity: 0.7}}>Data Analyst, TechCorp</p>
              </div>
            </div>
          </div>

          {/* Right Arrow */}
          <button style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgb(255, 255, 255)',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '80px',
          marginBottom: '60px'
        }}>
          <div style={{textAlign: 'center'}}>
            <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '48px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>100+</p>
            <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', color: 'rgba(27, 12, 37, 0.7)'}}>Businesses are Happy</p>
          </div>
          <div style={{textAlign: 'center'}}>
            <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '48px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>5000+</p>
            <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', color: 'rgba(27, 12, 37, 0.7)'}}>Data-driven decisions</p>
          </div>
          <div style={{textAlign: 'center'}}>
            <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '48px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>98%</p>
            <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', color: 'rgba(27, 12, 37, 0.7)'}}>Customer Satisfied</p>
          </div>
        </div>

        {/* Logo Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '48px',
          opacity: 0.6
        }}>
          <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '24px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>◆ business</span>
          <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '24px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>◎ logoipsum</span>
          <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '24px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>◉ Logoipsum</span>
          <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '24px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>∿ startup</span>
        </div>
      </div>
    </div>
  );
}

export default Testimonials;
