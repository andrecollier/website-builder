'use client';

import React from 'react';

export interface HeroProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Hero - Pixel-perfect variant
 *
 * Matches original component dimensions and styles exactly.
 * Bounding box: 1440x1440px
 */
export function Hero({ className, children }: HeroProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'rgb(247, 246, 247)',
        color: 'rgb(0, 0, 0)',
        fontSize: '12px',
        fontFamily: 'sans-serif',
        padding: '112px 16px 100px',
        marginTop: '-112px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '0px',
        borderRadius: '0 0 16px 16px',
        minHeight: '200px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Sky background */}
      <img
        src="https://framerusercontent.com/images/vkYLURkIQB3wgCJUD4m2MGdbKg.png"
        alt="Sky background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          borderRadius: '16px'
        }}
      />
      <section style={{display: 'flex', position: 'relative', zIndex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', width: '1408px', height: 'auto', padding: '140px 16px 100px', fontFamily: '\'sans-serif\', sans-serif', fontSize: '12px', fontWeight: '400', backgroundColor: 'transparent', border: '0px none rgb(0, 0, 0)', opacity: '1', overflow: 'hidden', objectFit: 'fill'}}><div style={{display: 'flex', position: 'relative', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '60px', width: '1240px', height: 'auto', maxWidth: '1240px', fontFamily: '\'sans-serif\', sans-serif', fontSize: '12px', fontWeight: '400', border: '0px none rgb(0, 0, 0)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}><div style={{display: 'flex', position: 'relative', zIndex: '1', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: '40px', width: '800px', height: 'auto', maxWidth: '800px', fontFamily: '\'sans-serif\', sans-serif', fontSize: '12px', fontWeight: '400', border: '0px none rgb(0, 0, 0)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}><div style={{display: 'flex', position: 'relative', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: '24px', width: '800px', height: 'auto', fontFamily: '\'sans-serif\', sans-serif', fontSize: '12px', fontWeight: '400', border: '0px none rgb(0, 0, 0)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}><div style={{display: 'flex', position: 'relative', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', width: '800px', height: 'auto', fontFamily: '\'sans-serif\', sans-serif', fontSize: '12px', fontWeight: '400', border: '0px none rgb(0, 0, 0)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}><div style={{display: 'block', position: 'relative', flexDirection: 'row', width: 'auto', height: '28px', fontFamily: '\'sans-serif\', sans-serif', fontSize: '12px', fontWeight: '400', border: '0px none rgb(0, 0, 0)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}><div style={{display: 'flex', position: 'relative', /* transform removed */ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '8px', width: 'auto', height: '28px', padding: '6px 14px', fontFamily: '\'sans-serif\', sans-serif', fontSize: '12px', fontWeight: '400', backgroundColor: 'rgb(255, 255, 255)', borderRadius: '999px', border: '0px none rgb(0, 0, 0)', boxShadow: 'rgba(0, 0, 0, 0.07) 0px 2px 5px 0px, rgba(0, 0, 0, 0.06) 0px 8px 8px 0px, rgba(0, 0, 0, 0.04) 0px 19px 11px 0px, rgba(0, 0, 0, 0.01) 0px 33px 13px 0px, rgba(0, 0, 0, 0) 0px 52px 15px 0px', opacity: '1', overflow: 'visible', objectFit: 'fill'}}><p style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', lineHeight: '16px', color: 'rgb(27, 12, 37)', whiteSpace: 'nowrap'}}>BUSINESS & SOLUTION</p></div></div><div style={{display: 'flex', position: 'relative', flexDirection: 'column', justifyContent: 'flex-start', width: '800px', height: '120px', fontFamily: '\'sans-serif\', sans-serif', fontSize: '12px', fontWeight: '400', border: '0px none rgb(0, 0, 0)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}><h2 style={{display: 'block', position: 'static', flexDirection: 'row', width: '800px', height: '120px', fontFamily: '\'General Sans\', sans-serif', fontSize: '60px', fontWeight: '500', lineHeight: '60px', textAlign: 'center', color: 'rgb(27, 12, 37)', border: '0px none rgb(27, 12, 37)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}><span style={{display: 'inline-block', position: 'static', /* transform removed */ flexDirection: 'row', width: '105.672px', height: '60px', fontFamily: '\'General Sans\', sans-serif', fontSize: '60px', fontWeight: '500', lineHeight: '60px', textAlign: 'center', color: 'rgb(27, 12, 37)', border: '0px none rgb(27, 12, 37)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}>The </span><span style={{display: 'inline-block', position: 'static', /* transform removed */ flexDirection: 'row', width: '323.344px', height: '60px', fontFamily: '\'General Sans\', sans-serif', fontSize: '60px', fontWeight: '500', lineHeight: '60px', textAlign: 'center', color: 'rgb(27, 12, 37)', border: '0px none rgb(27, 12, 37)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}>AI-powered </span><span style={{display: 'inline-block', position: 'static', /* transform removed */ flexDirection: 'row', width: '268.812px', height: '60px', fontFamily: '\'General Sans\', sans-serif', fontSize: '60px', fontWeight: '500', lineHeight: '60px', textAlign: 'center', color: 'rgb(27, 12, 37)', border: '0px none rgb(27, 12, 37)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}>Customer </span><span style={{display: 'inline-block', position: 'static', /* transform removed */ flexDirection: 'row', width: '201.375px', height: '60px', fontFamily: '\'General Sans\', sans-serif', fontSize: '60px', fontWeight: '500', lineHeight: '60px', textAlign: 'center', color: 'rgb(27, 12, 37)', border: '0px none rgb(27, 12, 37)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}>Service </span><span style={{display: 'inline-block', position: 'static', /* transform removed */ flexDirection: 'row', width: '241.875px', height: '60px', fontFamily: '\'General Sans\', sans-serif', fontSize: '60px', fontWeight: '500', lineHeight: '60px', textAlign: 'center', color: 'rgb(27, 12, 37)', border: '0px none rgb(27, 12, 37)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}>Platform</span></h2></div></div><div style={{display: 'flex', position: 'relative', /* transform removed */ flexDirection: 'column', justifyContent: 'flex-start', width: '700px', height: '56px', maxWidth: '700px', fontFamily: '\'sans-serif\', sans-serif', fontSize: '12px', fontWeight: '400', border: '0px none rgb(0, 0, 0)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}><p style={{display: 'block', position: 'static', flexDirection: 'row', width: '700px', height: '56px', fontFamily: '\'General Sans\', sans-serif', fontSize: '18px', fontWeight: '400', lineHeight: '28px', textAlign: 'center', color: 'rgb(27, 12, 37)', border: '0px none rgb(27, 12, 37)', opacity: '1', overflow: 'visible', objectFit: 'fill'}}>Fluence AI helps you connect, manage, and optimize your AI tools effortlessly. Unlock powerful insights and automate complex processes with ease.</p></div>
{/* CTA Buttons */}
<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px'}}>
  <a href="#" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '14px 28px', backgroundColor: 'rgb(27, 12, 37)', color: 'rgb(255, 255, 255)', borderRadius: '8px', fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', textDecoration: 'none', boxShadow: 'rgba(255, 255, 255, 0.4) 0px 1px 2px 0px inset, rgba(0, 0, 0, 0.1) 0px 1px 2px 0px'}}>Get Started</a>
  <a href="#" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '14px 28px', backgroundColor: 'rgb(255, 255, 255)', color: 'rgb(27, 12, 37)', borderRadius: '8px', fontFamily: "'General Sans', sans-serif", fontSize: '16px', fontWeight: '500', textDecoration: 'none', border: '1px solid rgba(27, 12, 37, 0.2)', boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px 0px'}}>Book a Demo</a>
</div>
</div></div>
{/* Chat Interface Card */}
<div style={{display: 'flex', position: 'relative', zIndex: '1', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '1100px', marginTop: '40px'}}>
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    position: 'relative'
  }}>
    {/* Chat Messages */}
    <div style={{display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '220px'}}>
      {/* User Message */}
      <div style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '12px'}}>
        <div style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0e6fa', overflow: 'hidden', flexShrink: 0}}>
          <img src="https://framerusercontent.com/images/fPYqNYjQt1C0mfv9SHflYqsHY.png" alt="User" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
        <div style={{
          backgroundColor: 'rgb(247, 246, 247)',
          borderRadius: '16px',
          padding: '16px 20px',
          maxWidth: '500px',
          fontFamily: "'General Sans', sans-serif",
          fontSize: '15px',
          lineHeight: '1.6',
          color: 'rgb(27, 12, 37)'
        }}>
          Hey, I need help sending out a campaign to all new subscribers. Can you set that up?
        </div>
      </div>
      {/* AI Response */}
      <div style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '12px', marginLeft: '52px'}}>
        <div style={{
          backgroundColor: 'rgb(27, 12, 37)',
          borderRadius: '16px',
          padding: '16px 20px',
          maxWidth: '300px',
          fontFamily: "'General Sans', sans-serif",
          fontSize: '15px',
          lineHeight: '1.6',
          color: 'rgb(255, 255, 255)'
        }}>
          Yes, You can schedule it.
        </div>
      </div>
    </div>
    {/* Input Area */}
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      paddingTop: '24px',
      marginTop: '24px'
    }}>
      {/* GPT Selector Row */}
      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'rgb(247, 246, 247)', borderRadius: '8px', cursor: 'pointer'}}>
          <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>GPT 4.5</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="rgb(27, 12, 37)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'rgb(247, 246, 247)', borderRadius: '8px', cursor: 'pointer'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="5" stroke="rgb(27, 12, 37)" strokeWidth="1.5"/><path d="M10 10L13 13" stroke="rgb(27, 12, 37)" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span style={{fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)'}}>Search</span>
        </div>
      </div>
      {/* Input Field */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '18px 24px',
        backgroundColor: 'rgb(247, 246, 247)',
        borderRadius: '12px',
        fontFamily: "'General Sans', sans-serif",
        fontSize: '16px',
        color: 'rgba(27, 12, 37, 0.4)'
      }}>
        Ask anything ...
      </div>
      {/* Quick Actions */}
      <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', backgroundColor: 'rgb(247, 246, 247)', borderRadius: '10px', fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)', cursor: 'pointer'}}>
          <span style={{color: '#a855f7'}}>&#10022;</span> Create Workflow
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', backgroundColor: 'rgb(247, 246, 247)', borderRadius: '10px', fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)', cursor: 'pointer'}}>
          <span style={{color: '#a855f7'}}>&#10022;</span> Setup Bot
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', backgroundColor: 'rgb(247, 246, 247)', borderRadius: '10px', fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(27, 12, 37)', cursor: 'pointer'}}>
          <span style={{color: '#a855f7'}}>&#10022;</span> Schedule Message
        </div>
      </div>
    </div>
    {/* Floating buttons */}
    <div style={{position: 'absolute', bottom: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'rgb(27, 12, 37)', borderRadius: '8px', fontFamily: "'General Sans', sans-serif", fontSize: '14px', fontWeight: '500', color: 'rgb(255, 255, 255)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'}}>
        Get Template - $49
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '6px', fontFamily: "'General Sans', sans-serif", fontSize: '12px', fontWeight: '500', color: 'rgb(27, 12, 37)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
        <span style={{fontSize: '10px'}}>&#9679;</span> Made in Framer
      </div>
    </div>
  </div>
</div>
</div></section>
    </div>
  );
}

export default Hero;
