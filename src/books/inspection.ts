import { bookDisplayAuthor, formatsForBook, type Book } from './catalog.ts';
export const isAudioFormat=(format:string):boolean=>['m4b','mp3','other-audio'].includes(format);
export function coverElement(book:Book,real:boolean):HTMLElement {
  const cover=document.createElement('div');cover.className='cover';
  const monogram=document.createElement('span');monogram.setAttribute('aria-hidden','true');monogram.textContent=book.title.replace(/^(a|an|the)\s+/i,'').slice(0,1);cover.append(monogram);
  if(real&&book.coverId){
    const image=document.createElement('img');image.alt=`Cover of ${book.title}`;image.loading='lazy';image.src=`/__library/cover/${encodeURIComponent(book.coverId)}`;image.referrerPolicy='no-referrer';
    image.addEventListener('load',()=>{cover.replaceChildren(image);cover.classList.add('artwork');});cover.append(image);
  }
  return cover;
}
export function renderBookDetails(info:HTMLElement,book:Book,openBase:string,onLocate:()=>void):void {
  info.replaceChildren();
  const hero=document.createElement('div');hero.className='book-hero';
  const heading=document.createElement('div');heading.className='book-heading';
  const genre=document.createElement('p');genre.className='eyebrow';genre.textContent=book.genres.slice(0,2).join(' · ')||'From your collection';
  const title=document.createElement('h2');title.textContent=book.title;
  const author=document.createElement('p');author.className='author';author.textContent=bookDisplayAuthor(book);
  heading.append(genre,title,author);
  if(book.subtitle){const subtitle=document.createElement('p');subtitle.className='subtitle';subtitle.textContent=book.subtitle;heading.append(subtitle);}
  const formats=document.createElement('div');formats.className='format-tags';
  formatsForBook(book).forEach(format=>{const tag=document.createElement('span');tag.className='tag';tag.textContent=isAudioFormat(format)?'◉ Audiobook':format==='other-ebook'?'▤ E-book':`▤ ${format.toUpperCase()}`;formats.append(tag);});
  heading.append(formats);hero.append(coverElement(book,Boolean(openBase)),heading);
  const actions=document.createElement('div');actions.className='book-actions';
  if(openBase&&book.sourceId==='audiobookshelf'){
    const seen=new Set<string>();
    for(const edition of book.editions){
      const audio=isAudioFormat(edition.format),key=`${audio?'audio':'ebook'}:${edition.sourceItemId}`;if(seen.has(key))continue;seen.add(key);
      const link=document.createElement('a');link.className='source-link';link.textContent=audio?'Audiobook in Audiobookshelf ↗':'E-book in Audiobookshelf ↗';link.href=`${openBase}/item/${encodeURIComponent(edition.sourceItemId)}`;link.title='Opens this title’s Audiobookshelf page';link.target='_blank';link.rel='noopener noreferrer';actions.append(link);
    }
    if(!seen.size){const link=document.createElement('a');link.className='source-link';link.textContent='View in Audiobookshelf ↗';link.href=`${openBase}/item/${encodeURIComponent(book.sourceItemId||'')}`;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}
  }else{const note=document.createElement('p');note.className='sample-note';note.textContent='An original sample title. Connect Audiobookshelf to read or listen to your collection.';actions.append(note);}
  const locate=document.createElement('button');locate.className='locate-book';locate.textContent='⌖ Find on shelf';locate.addEventListener('click',onLocate);actions.append(locate);
  const about=document.createElement('section');about.className='book-about';const aboutLabel=document.createElement('h3');aboutLabel.textContent='About this book';const description=document.createElement('p');description.textContent=book.description||'No description has been added to this title yet.';about.append(aboutLabel,description);
  const metadata=document.createElement('dl');metadata.className='metadata';
  const field=(label:string,value:string|undefined)=>{if(!value)return;const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;metadata.append(dt,dd);};
  const duration=book.editions.find(edition=>edition.durationSeconds)?.durationSeconds,minutes=duration?Math.round(duration/60):0;
  field('Series',book.series?`${book.series.name}${book.series.index!=null?` · Book ${book.series.index}`:''}`:undefined);
  field('Narrator',book.narrators?.join(', '));field('Length',duration?`${Math.floor(minutes/60)} hr ${minutes%60} min`:undefined);field('Published',book.publicationYear?.toString());field('Publisher',book.publisher);field('Language',book.language);field('ISBN',book.isbn);field('Genres',book.genres.join(' · '));
  info.append(hero,actions,about,metadata);info.scrollTop=0;
}
