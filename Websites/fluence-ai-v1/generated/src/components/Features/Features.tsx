'use client';

import React from 'react';

export interface FeaturesProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Features - Product Overview Section
 * Matches reference: Large card with text left, illustration right
 */
export function Features({ className, children }: FeaturesProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'rgb(247, 246, 247)',
        padding: '100px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* Section Header */}
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginBottom: '60px', maxWidth: '800px'}}>
        <div style={{
          display: 'flex',
          padding: '8px 16px',
          backgroundColor: 'rgb(255, 255, 255)',
          borderRadius: '999px',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', letterSpacing: '0.5px', color: 'rgb(27, 12, 37)'}}>PRODUCT OVERVIEW</p>
        </div>
        <h2 style={{fontFamily: "'General Sans', sans-serif", fontSize: '56px', fontWeight: '500', lineHeight: '64px', textAlign: 'center', color: 'rgb(27, 12, 37)'}}>
          Explore the Power of Fluence AI
        </h2>
        <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '18px', fontWeight: '400', lineHeight: '28px', textAlign: 'center', color: 'rgb(27, 12, 37)'}}>
          Discover how Fluence AI transforms raw data into actionable insights. Our advanced features are designed to optimize workflows
        </p>
      </div>

      {/* Feature Card - Seamless Data Integration */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        maxWidth: '1240px',
        backgroundColor: 'rgb(255, 255, 255)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
      }}>
        {/* Left Content */}
        <div style={{
          flex: 1,
          padding: '60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h3 style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '40px',
            fontWeight: '500',
            lineHeight: '48px',
            color: 'rgb(27, 12, 37)',
            marginBottom: '24px'
          }}>
            Seamless Data Integration Process
          </h3>
          <p style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '16px',
            lineHeight: '26px',
            color: 'rgba(27, 12, 37, 0.7)',
            marginBottom: '32px'
          }}>
            Effortlessly connect with diverse data sources, ensuring smooth data flow for real-time insights and accurate analysis.
          </p>

          {/* Bullet Points */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 12h6M12 9v6"/>
                </svg>
              </div>
              <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>Unified Data Connections</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </div>
              <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>Real-Time Data Syncing</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
                  <path d="M4 4h16v16H4z"/>
                  <path d="M9 9h6v6H9z"/>
                  <path d="M4 9h5M15 9h5M9 4v5M9 15v5"/>
                </svg>
              </div>
              <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>Flexible API Integrations</span>
            </div>
          </div>
        </div>

        {/* Right Illustration */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.3) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '500px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Placeholder for 3D illustration */}
          <div style={{
            width: '85%',
            height: '85%',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            transform: 'perspective(1000px) rotateY(-10deg) rotateX(5deg)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px'
          }}>
            <div style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', color: 'rgba(27,12,37,0.5)', marginBottom: '8px'}}>Spendings</div>
            <div style={{fontFamily: "'General Sans', sans-serif", fontSize: '28px', fontWeight: '500', color: 'rgb(27, 12, 37)', marginBottom: '24px'}}>Data Mapping</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px', flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{width: '80px', height: '10px', backgroundColor: 'rgb(168, 85, 247)', borderRadius: '4px'}}></div>
                <span style={{fontSize: '12px', color: 'rgba(27,12,37,0.5)'}}>$1000</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{width: '100px', height: '10px', backgroundColor: 'rgb(168, 85, 247)', borderRadius: '4px'}}></div>
                <span style={{fontSize: '12px', color: 'rgba(27,12,37,0.5)'}}>$1500</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{width: '50px', height: '10px', backgroundColor: 'rgb(168, 85, 247)', borderRadius: '4px'}}></div>
                <span style={{fontSize: '12px', color: 'rgba(27,12,37,0.5)'}}>$200</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{width: '20px', height: '10px', backgroundColor: 'rgb(220, 220, 220)', borderRadius: '4px'}}></div>
                <span style={{fontSize: '12px', color: 'rgba(27,12,37,0.5)'}}>$0</span>
              </div>
            </div>
            <div style={{fontFamily: "'General Sans', sans-serif", fontSize: '12px', color: 'rgba(27,12,37,0.4)', marginTop: 'auto'}}>Current margin: April Spend</div>
          </div>
        </div>
      </div>

      {/* Feature Card 2 - Advanced AI-Powered Analytics Tools (reversed layout) */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        maxWidth: '1240px',
        backgroundColor: 'rgb(255, 255, 255)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        marginTop: '40px'
      }}>
        {/* Left Illustration */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.35) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '500px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '80%',
            height: '80%',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            transform: 'perspective(1000px) rotateY(10deg) rotateX(5deg)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            position: 'relative'
          }}>
            <div style={{
              fontFamily: "'General Sans', sans-serif",
              fontSize: '20px',
              fontWeight: '500',
              color: 'rgb(27, 12, 37)',
              marginBottom: '24px',
              transform: 'rotate(-15deg)',
              position: 'absolute',
              top: '40px',
              left: '20px'
            }}>Predictive Analytics</div>
            {/* Country labels */}
            <div style={{position: 'absolute', top: '60px', right: '40px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <span style={{fontSize: '12px', color: 'rgb(168, 85, 247)'}}>• United States</span>
              <span style={{fontSize: '12px', color: 'rgb(168, 85, 247)'}}>• Canada</span>
              <span style={{fontSize: '12px', color: 'rgb(168, 85, 247)'}}>• Mexico</span>
            </div>
            {/* Donut chart placeholder */}
            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'conic-gradient(rgb(168, 85, 247) 0deg 180deg, rgb(236, 72, 153) 180deg 270deg, rgb(251, 191, 36) 270deg 360deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'white'}}></div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div style={{
          flex: 1,
          padding: '60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h3 style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '40px',
            fontWeight: '500',
            lineHeight: '48px',
            color: 'rgb(27, 12, 37)',
            marginBottom: '24px'
          }}>
            Advanced AI-Powered Analytics Tools
          </h3>
          <p style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '16px',
            lineHeight: '26px',
            color: 'rgba(27, 12, 37, 0.7)',
            marginBottom: '32px'
          }}>
            Leverage intelligent analytics to uncover hidden patterns, predict future trends, and make data-driven decisions with confidence.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
                  <path d="M3 3v18h18"/>
                  <path d="M18 17V9"/>
                  <path d="M13 17V5"/>
                  <path d="M8 17v-3"/>
                </svg>
              </div>
              <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>Accurate Trend Forecasting</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>Dynamic Insightful Dashboards</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>AI-Driven Data Metrics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Card 3 - Intelligent Automation Workflow Engine */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        maxWidth: '1240px',
        backgroundColor: 'rgb(255, 255, 255)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        marginTop: '40px'
      }}>
        {/* Left Content */}
        <div style={{
          flex: 1,
          padding: '60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h3 style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '40px',
            fontWeight: '500',
            lineHeight: '48px',
            color: 'rgb(27, 12, 37)',
            marginBottom: '24px'
          }}>
            Intelligent Automation Workflow Engine
          </h3>
          <p style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '16px',
            lineHeight: '26px',
            color: 'rgba(27, 12, 37, 0.7)',
            marginBottom: '32px'
          }}>
            Automate repetitive tasks, optimize workflows, and boost productivity with smart, AI-powered automation capabilities.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>Streamlined Workflow Automation</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>Efficient Task Optimization</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgb(247, 246, 247)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(27, 12, 37)" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>Smart Trigger Functions</span>
            </div>
          </div>
        </div>

        {/* Right Illustration */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.3) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '500px',
          position: 'relative',
          overflow: 'hidden',
          padding: '40px'
        }}>
          {/* Integration icons row */}
          <div style={{display: 'flex', gap: '16px', marginBottom: '32px'}}>
            {[
              {bg: 'rgb(255, 87, 51)', icon: '⚡'},
              {bg: 'rgb(168, 85, 247)', icon: '★'},
              {bg: 'rgb(236, 72, 153)', icon: '✕'},
              {bg: 'rgb(251, 146, 60)', icon: '▶'},
              {bg: 'rgb(107, 114, 128)', icon: '⚙'}
            ].map((item, i) => (
              <div key={i} style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>{item.icon}</div>
            ))}
          </div>

          {/* Workflow cards */}
          <div style={{display: 'flex', gap: '20px', width: '100%', maxWidth: '500px'}}>
            {/* Left card */}
            <div style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
            }}>
              <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
                <div style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgb(168, 85, 247)'}}></div>
                <div style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgb(209, 213, 219)'}}></div>
                <div style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgb(209, 213, 219)'}}></div>
              </div>
              <div style={{height: '8px', backgroundColor: 'rgb(229, 231, 235)', borderRadius: '4px', marginBottom: '8px', width: '80%'}}></div>
              <div style={{height: '8px', backgroundColor: 'rgb(229, 231, 235)', borderRadius: '4px', marginBottom: '8px', width: '60%'}}></div>
              <div style={{height: '8px', backgroundColor: 'rgb(229, 231, 235)', borderRadius: '4px', width: '70%'}}></div>
            </div>

            {/* Right card - New Task */}
            <div style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
            }}>
              <div style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)', marginBottom: '16px'}}>New Task</div>
              <div style={{height: '8px', backgroundColor: 'rgb(229, 231, 235)', borderRadius: '4px', marginBottom: '8px'}}></div>
              <div style={{height: '8px', backgroundColor: 'rgb(229, 231, 235)', borderRadius: '4px', marginBottom: '8px'}}></div>
              <div style={{height: '8px', backgroundColor: 'rgb(229, 231, 235)', borderRadius: '4px', marginBottom: '16px'}}></div>
              <button style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgb(27, 12, 37)',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontFamily: "'General Sans', sans-serif",
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>Generate</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Features;
