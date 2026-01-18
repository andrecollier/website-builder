'use client';

import React from 'react';

export interface Features2Props {
  className?: string;
}

const leftBenefits = [
  { title: 'Increased Efficiency', desc: 'Automate tasks and reduce manual workloads' },
  { title: 'Scalable Solutions', desc: 'Easily grow with the demands of your data' },
  { title: 'Faster Decision-Making', desc: 'Leverage real-time insights for quicker choices' }
];

const rightBenefits = [
  { title: 'Enhanced Collaboration', desc: 'Streamline workflows with team-friendly features' },
  { title: 'Data Security', desc: 'Safeguard your data with top-tier encryption' },
  { title: 'Continuous Improvement', desc: 'Let AI adapt and improve with evolving data' }
];

export function Features2({ className }: Features2Props) {
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
        padding: '6px 14px',
        backgroundColor: 'rgb(255, 255, 255)',
        borderRadius: '999px',
        boxShadow: 'rgba(0, 0, 0, 0.07) 0px 2px 5px 0px',
        marginBottom: '24px'
      }}>
        <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>
          KEY BENEFITS
        </p>
      </div>

      <h2 style={{
        fontFamily: "'General Sans', sans-serif",
        fontSize: '60px',
        fontWeight: '500',
        lineHeight: '66px',
        textAlign: 'center',
        color: 'rgb(27, 12, 37)',
        marginBottom: '24px'
      }}>
        Why Choose Fluence AI
      </h2>

      <p style={{
        fontFamily: "'General Sans', sans-serif",
        fontSize: '18px',
        lineHeight: '28px',
        textAlign: 'center',
        color: 'rgba(27, 12, 37, 0.7)',
        maxWidth: '700px',
        marginBottom: '60px'
      }}>
        Fluence AI offers powerful benefits that help you save time, improve decision-making, and scale your data operations effortlessly.
      </p>

      {/* Benefits Grid */}
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1240px',
        backgroundColor: 'rgb(255, 255, 255)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* Left Benefits */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '40px'}}>
          {leftBenefits.map((item, i) => (
            <div key={i}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 233, 245) 100%)',
                boxShadow: 'rgba(82, 44, 102, 0.1) 0px 1px 8px 0px, rgb(255, 255, 255) 0px 1px 1px 0px inset',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(168, 85, 247)" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <h3 style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: '18px',
                fontWeight: '500',
                color: 'rgb(27, 12, 37)',
                marginBottom: '8px'
              }}>{item.title}</h3>
              <p style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: '16px',
                lineHeight: '26px',
                color: 'rgba(27, 12, 37, 0.7)'
              }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Center - Team Collaboration Card */}
        <div style={{
          flex: 1.5,
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(251, 191, 36, 0.1) 50%, rgba(168, 85, 247, 0.2) 100%)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '24px',
            flex: 1,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{
              fontFamily: "'General Sans', sans-serif",
              fontSize: '18px',
              fontWeight: '500',
              color: 'rgb(27, 12, 37)',
              marginBottom: '24px'
            }}>Team Collaboration</h4>

            {/* Avatar Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px'
            }}>
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <div key={i} style={{
                  aspectRatio: '1',
                  backgroundColor: i === 0 || i === 4 || i === 5 ? 'rgba(168, 85, 247, 0.1)' : 'rgb(247, 246, 247)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {(i === 0 || i === 4 || i === 5) && (
                    <div style={{
                      width: '60%',
                      height: '60%',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(168, 85, 247, 0.3)'
                    }}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Benefits */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '40px'}}>
          {rightBenefits.map((item, i) => (
            <div key={i}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 233, 245) 100%)',
                boxShadow: 'rgba(82, 44, 102, 0.1) 0px 1px 8px 0px, rgb(255, 255, 255) 0px 1px 1px 0px inset',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(168, 85, 247)" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <h3 style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: '18px',
                fontWeight: '500',
                color: 'rgb(27, 12, 37)',
                marginBottom: '8px'
              }}>{item.title}</h3>
              <p style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: '16px',
                lineHeight: '26px',
                color: 'rgba(27, 12, 37, 0.7)'
              }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
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
  );
}

export default Features2;
