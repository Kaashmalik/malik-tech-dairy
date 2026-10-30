// Urdu section: right-to-left, Nastaliq font, Urdu language for screen readers/search
export default function UrduLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang='ur' dir='rtl' className='font-urdu'>
      {children}
    </div>
  );
}
