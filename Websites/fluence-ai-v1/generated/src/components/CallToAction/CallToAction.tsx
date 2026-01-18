'use client';

import React from 'react';

export interface CallToActionProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * CallToAction - FAQ Section
 */
export function CallToAction({ className, children }: CallToActionProps) {
  const faqItems = [
    {
      question: "Can I integrate Fluence AI with my existing tools?",
      answer: "Yes! Fluence AI supports integration with a wide range of tools and platforms. Our flexible APIs allow you to connect with your data sources effortlessly, enabling a smooth workflow."
    },
    {
      question: "How does Fluence AI automate tasks?",
      answer: "Fluence AI uses advanced machine learning algorithms to identify patterns and automate repetitive tasks, saving you time and reducing manual effort."
    },
    {
      question: "Is my data secure with Fluence AI?",
      answer: "Absolutely. We prioritize data security with enterprise-grade encryption and compliance with industry standards to keep your information safe."
    },
    {
      question: "What kind of support do you offer?",
      answer: "We offer 24/7 customer support through chat, email, and phone. Our dedicated team is always ready to help you get the most out of Fluence AI."
    }
  ];

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'rgb(247, 246, 247)',
        padding: '100px 16px 140px',
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '60px',
        width: '100%',
        maxWidth: '1240px',
        padding: '40px',
        backgroundColor: 'rgb(255, 255, 255)',
        borderRadius: '16px'
      }}>
        {/* Left Column */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '40px', width: '366px', flexShrink: 0}}>
          {/* Header */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div style={{
              display: 'inline-flex',
              padding: '6px 14px',
              backgroundColor: 'rgb(255, 255, 255)',
              borderRadius: '999px',
              boxShadow: 'rgba(0, 0, 0, 0.07) 0px 2px 5px 0px, rgba(0, 0, 0, 0.06) 0px 8px 8px 0px, rgba(0, 0, 0, 0.04) 0px 19px 11px 0px',
              width: 'fit-content'
            }}>
              <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>FAQ</p>
            </div>
            <h3 style={{
              fontFamily: "'General Sans', sans-serif",
              fontSize: '44px',
              fontWeight: '500',
              lineHeight: '52.8px',
              color: 'rgb(27, 12, 37)'
            }}>Frequently Asked Questions</h3>
          </div>
          {/* Contact */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <h4 style={{fontFamily: "'General Sans', sans-serif", fontSize: '24px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>Still have a question?</h4>
            <p style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', color: 'rgb(27, 12, 37)'}}>
              <a href="https://fluence.framer.website/contact" style={{fontWeight: '500', textDecoration: 'none', color: 'inherit'}}>Contact us!</a>
              {' '}We'll be happy to help you.
            </p>
            <img
              src="https://framerusercontent.com/images/LoT2PCgmdckMGZKf93yPbkmNoDU.png?width=309&height=131"
              alt="Support team"
              style={{width: '142px', height: '60px', objectFit: 'cover'}}
            />
          </div>
        </div>

        {/* Right Column - FAQ Items */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px', flex: 1}}>
          {faqItems.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                backgroundColor: 'rgb(247, 246, 247)',
                borderRadius: '8px',
                gap: '16px'
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h4 style={{
                  fontFamily: "'General Sans', sans-serif",
                  fontSize: '24px',
                  fontWeight: '500',
                  color: 'rgb(27, 12, 37)'
                }}>{item.question}</h4>
                <div style={{
                  width: '16px',
                  height: '16px',
                  position: 'relative',
                  flexShrink: 0
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '7px',
                    left: '-2px',
                    width: '20px',
                    height: '2px',
                    backgroundColor: 'rgb(27, 12, 37)',
                    borderRadius: '10px'
                  }}></div>
                  {index !== 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '7px',
                      width: '2px',
                      height: '20px',
                      backgroundColor: 'rgb(27, 12, 37)',
                      borderRadius: '10px'
                    }}></div>
                  )}
                </div>
              </div>
              {index === 0 && (
                <p style={{
                  fontFamily: "'General Sans', sans-serif",
                  fontSize: '16px',
                  lineHeight: '26px',
                  color: 'rgb(27, 12, 37)'
                }}>{item.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CallToAction;
