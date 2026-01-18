'use client';

import React from 'react';

export interface Pricing2Props {
  className?: string;
}

const plans = [
  {
    name: 'Starter',
    icon: '★',
    desc: 'Get started with Fluence AI at no cost',
    price: 'Free',
    priceDesc: '',
    buttonStyle: 'outline',
    features: ['400 AI credits at signup', '20,000 AI token inputs', 'Calendar integration & syncing', 'Guest sharing and links']
  },
  {
    name: 'Plus',
    icon: '★',
    desc: 'Unlock more powerful features',
    price: '$22',
    priceDesc: '/month, per user',
    buttonStyle: 'filled',
    popular: true,
    features: ['Unlimited AI credits', '50,000 AI token inputs', 'Calendar integration & syncing', 'Guest sharing and links']
  },
  {
    name: 'Pro',
    icon: '★',
    desc: 'Take your business to the next level',
    price: '$69',
    priceDesc: '/month, per user',
    buttonStyle: 'outline',
    features: ['Unlimited AI creation', '100,000 AI token inputs', 'Calendar integration & syncing', 'Guest sharing and links']
  }
];

export function Pricing2({ className }: Pricing2Props) {
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
          PRICING
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
        Simple, Flexible Pricing
      </h2>

      <p style={{
        fontFamily: "'General Sans', sans-serif",
        fontSize: '18px',
        lineHeight: '28px',
        color: 'rgba(27, 12, 37, 0.7)',
        marginBottom: '40px'
      }}>
        Pricing plans for businesses at every stage of growth.
      </p>

      {/* Toggle */}
      <div style={{
        display: 'flex',
        backgroundColor: 'rgb(237, 235, 238)',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '60px'
      }}>
        <button style={{
          padding: '8px 24px',
          backgroundColor: 'rgb(255, 255, 255)',
          borderRadius: '4px',
          border: 'none',
          fontFamily: "'General Sans', sans-serif",
          fontSize: '16px',
          fontWeight: '500',
          color: 'rgb(27, 12, 37)',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
        }}>Monthly</button>
        <button style={{
          padding: '8px 24px',
          backgroundColor: 'transparent',
          borderRadius: '4px',
          border: 'none',
          fontFamily: "'General Sans', sans-serif",
          fontSize: '16px',
          fontWeight: '500',
          color: 'rgba(27, 12, 37, 0.6)',
          cursor: 'pointer'
        }}>Yearly</button>
      </div>

      {/* Pricing Cards */}
      <div style={{
        display: 'flex',
        gap: '24px',
        width: '100%',
        maxWidth: '1240px'
      }}>
        {plans.map((plan, i) => (
          <div key={i} style={{
            flex: 1,
            backgroundColor: 'rgb(255, 255, 255)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            border: plan.popular ? '2px solid rgb(168, 85, 247)' : 'none'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
              <span style={{color: 'rgb(168, 85, 247)'}}>{plan.icon}</span>
              <h3 style={{fontFamily: "'General Sans', sans-serif", fontSize: '24px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>{plan.name}</h3>
              {plan.popular && (
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: 'rgb(27, 12, 37)',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>Popular</span>
              )}
            </div>
            <p style={{
              fontFamily: "'General Sans', sans-serif",
              fontSize: '16px',
              color: 'rgba(27, 12, 37, 0.7)',
              marginBottom: '24px'
            }}>{plan.desc}</p>

            <div style={{marginBottom: '24px'}}>
              <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '48px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>{plan.price}</span>
              {plan.priceDesc && <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '16px', color: 'rgba(27, 12, 37, 0.6)'}}>{plan.priceDesc}</span>}
            </div>

            <button style={{
              width: '100%',
              padding: '14px',
              backgroundColor: plan.buttonStyle === 'filled' ? 'rgb(27, 12, 37)' : 'transparent',
              color: plan.buttonStyle === 'filled' ? 'white' : 'rgb(27, 12, 37)',
              border: plan.buttonStyle === 'filled' ? 'none' : '1px solid rgba(0,0,0,0.2)',
              borderRadius: '8px',
              fontFamily: "'General Sans', sans-serif",
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              marginBottom: '32px'
            }}>Get Started</button>

            <p style={{
              fontFamily: "'General Sans', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
              color: 'rgba(27, 12, 37, 0.5)',
              marginBottom: '16px'
            }}>What's Included</p>

            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {plan.features.map((feature, j) => (
                <div key={j} style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{color: 'rgb(168, 85, 247)'}}>✦</span>
                  <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', color: 'rgb(27, 12, 37)'}}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Pricing2;
