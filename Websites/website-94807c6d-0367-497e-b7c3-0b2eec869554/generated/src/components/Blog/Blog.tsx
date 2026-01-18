'use client';

import React from 'react';

export interface BlogProps {
  className?: string;
}

const blogPosts = [
  {
    image: 'https://framerusercontent.com/images/eetEvxW02PAzDQTNZEJNez0XPc.png',
    tag: 'STARTUP',
    date: 'OCT 10, 2024',
    title: 'Why Data Security is Vital for Every SaaS Platform'
  },
  {
    image: 'https://framerusercontent.com/images/eetEvxW02PAzDQTNZEJNez0XPc.png',
    tag: 'SAAS',
    date: 'MAR 13, 2025',
    title: 'Efficient Strategies for Scaling Your SaaS Business'
  },
  {
    image: 'https://framerusercontent.com/images/eetEvxW02PAzDQTNZEJNez0XPc.png',
    tag: 'AI',
    date: 'FEB 16, 2025',
    title: 'The Ultimate SaaS Template for Startups'
  }
];

export function Blog({ className }: BlogProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'rgb(247, 246, 247)',
        padding: '100px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        maxWidth: '1240px',
        marginBottom: '60px'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            padding: '6px 14px',
            backgroundColor: 'rgb(255, 255, 255)',
            borderRadius: '999px',
            boxShadow: 'rgba(0, 0, 0, 0.07) 0px 2px 5px 0px',
            marginBottom: '24px'
          }}>
            <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>
              BLOG
            </p>
          </div>
          <h2 style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '60px',
            fontWeight: '500',
            lineHeight: '66px',
            color: 'rgb(27, 12, 37)'
          }}>
            Explore Our Blog And<br />Stay Updated
          </h2>
        </div>
        <a href="#" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '14px 28px',
          backgroundColor: 'rgb(255, 255, 255)',
          color: 'rgb(27, 12, 37)',
          borderRadius: '8px',
          border: '1px solid rgba(0,0,0,0.1)',
          fontFamily: "'General Sans', sans-serif",
          fontSize: '16px',
          fontWeight: '500',
          textDecoration: 'none'
        }}>Explore All</a>
      </div>

      {/* Blog Cards */}
      <div style={{
        display: 'flex',
        gap: '24px',
        width: '100%',
        maxWidth: '1240px'
      }}>
        {blogPosts.map((post, i) => (
          <div key={i} style={{
            flex: 1,
            backgroundColor: 'rgb(255, 255, 255)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              height: '250px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <img
                src={post.image}
                alt={post.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'grayscale(100%)'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '100px',
                background: 'linear-gradient(to top, rgba(168, 85, 247, 0.3), transparent)'
              }}></div>
            </div>
            <div style={{padding: '24px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: 'rgb(247, 246, 247)',
                  borderRadius: '4px',
                  fontFamily: "'General Sans', sans-serif",
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 'rgb(27, 12, 37)'
                }}>{post.tag}</span>
                <span style={{
                  fontFamily: "'General Sans', sans-serif",
                  fontSize: '14px',
                  color: 'rgba(27, 12, 37, 0.6)'
                }}>{post.date}</span>
              </div>
              <h3 style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: '20px',
                fontWeight: '500',
                lineHeight: '28px',
                color: 'rgb(27, 12, 37)'
              }}>{post.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Blog;
