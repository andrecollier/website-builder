'use client';

import React from 'react';

export interface HowItWorksProps {
  className?: string;
}

export function HowItWorks({ className }: HowItWorksProps) {
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
      {/* Top Section - 3 Step Process */}
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1240px',
        gap: '40px',
        marginBottom: '60px'
      }}>
        {/* Left Content */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={{
            display: 'inline-flex',
            padding: '6px 14px',
            backgroundColor: 'rgb(255, 255, 255)',
            borderRadius: '999px',
            boxShadow: 'rgba(0, 0, 0, 0.07) 0px 2px 5px 0px',
            marginBottom: '24px',
            width: 'fit-content'
          }}>
            <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>
              HOT IT WORKS
            </p>
          </div>
          <h2 style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '60px',
            fontWeight: '500',
            lineHeight: '66px',
            color: 'rgb(27, 12, 37)',
            marginBottom: '24px'
          }}>
            A Simple 3-Step Process
          </h2>
          <p style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '16px',
            lineHeight: '26px',
            color: 'rgba(27, 12, 37, 0.7)',
            marginBottom: '32px',
            maxWidth: '500px'
          }}>
            Get started quickly and effortlessly with Fluence AI's streamlined 3-step process designed to optimize your data workflow.
          </p>
          <div style={{display: 'flex', gap: '16px'}}>
            <a href="#" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '14px 28px',
              backgroundColor: 'rgb(27, 12, 37)',
              color: 'rgb(255, 255, 255)',
              borderRadius: '8px',
              fontFamily: "'General Sans', sans-serif",
              fontSize: '16px',
              fontWeight: '500',
              textDecoration: 'none'
            }}>Get Started</a>
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
            }}>Book a Demo</a>
          </div>
        </div>

        {/* Right Image */}
        <div style={{
          flex: 1,
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <img
            src="https://framerusercontent.com/images/eetEvxW02PAzDQTNZEJNez0XPc.png"
            alt="Team collaboration"
            style={{
              width: '100%',
              height: '400px',
              objectFit: 'cover',
              filter: 'grayscale(100%)'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgb(168, 85, 247)'}}></div>
            <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>AI Analysis Complete</span>
          </div>
        </div>
      </div>

      {/* 3 Step Cards */}
      <div style={{
        display: 'flex',
        gap: '24px',
        width: '100%',
        maxWidth: '1240px'
      }}>
        {[
          {title: 'Connect Your Data', desc: 'Effortlessly integrate data from various sources into a unified system.', icon: '🔗', color: 'rgba(168, 85, 247, 0.2)'},
          {title: 'Analyze and Optimize', desc: 'Use AI to uncover valuable insights and improve performance.', icon: '✓', color: 'rgba(168, 85, 247, 0.15)'},
          {title: 'Let AI Work', desc: 'Streamline tasks and enhance productivity with AI.', icon: '🌐', color: 'rgba(168, 85, 247, 0.25)'}
        ].map((step, i) => (
          <div key={i} style={{
            flex: 1,
            backgroundColor: 'rgb(255, 255, 255)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              height: '200px',
              background: `linear-gradient(135deg, ${step.color} 0%, rgba(168, 85, 247, 0.3) 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
              }}>
                {step.icon}
              </div>
            </div>
            <div style={{padding: '24px'}}>
              <h3 style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: '24px',
                fontWeight: '500',
                color: 'rgb(27, 12, 37)',
                marginBottom: '12px'
              }}>{step.title}</h3>
              <p style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: '16px',
                lineHeight: '26px',
                color: 'rgba(27, 12, 37, 0.7)'
              }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HowItWorks;
