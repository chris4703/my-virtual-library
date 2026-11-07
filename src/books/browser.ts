import { bookDisplayAuthor, sortBooksForShelf, type Book } from './catalog.ts';
import { coverElement, isAudioFormat } from './inspection.ts';

export class CollectionBrowser {
  private books:readonly Book[]=[];
  private real=false;
  private limit=36;
  private search=document.querySelector<HTMLInputElement>('#search')!;
  private format=document.querySelector<HTMLSelectElement>('#format-filter')!;
  private sort=document.querySelector<HTMLSelectElement>('#sort-books')!;
  private results=document.querySelector<HTMLUListElement>('#results')!;
  private more=document.querySelector<HTMLButtonElement>('#more-books')!;
  constructor(private onChoose:(book:Book)=>void){
    for(const input of [this.search,this.format,this.sort])input.addEventListener('input',()=>{this.limit=36;this.render();});
    this.more.addEventListener('click',()=>{this.limit+=36;this.render();});
  }
  setBooks(books:readonly Book[],real:boolean):void{this.books=books;this.real=real;this.limit=36;this.render();}
  render():void{
    const query=this.search.value.toLocaleLowerCase().trim(),format=this.format.value;
    let matches=this.books.filter(book=>[book.title,book.subtitle,bookDisplayAuthor(book),book.series?.name,...book.genres].join(' ').toLocaleLowerCase().includes(query)&&
      (format==='all'||book.editions.some(edition=>format==='audio'?isAudioFormat(edition.format):!isAudioFormat(edition.format))));
    matches=sortBooksForShelf(matches);
    if(this.sort.value==='author')matches.sort((a,b)=>bookDisplayAuthor(a).localeCompare(bookDisplayAuthor(b))||a.title.localeCompare(b.title));
    document.querySelector('#count')!.textContent=`${matches.length.toLocaleString()} ${matches.length===1?'title':'titles'}${query?' found':''}`;
    this.results.replaceChildren();
    for(const book of matches.slice(0,this.limit)){
      const li=document.createElement('li'),button=document.createElement('button');button.className='book-row';
      const copy=document.createElement('span');copy.className='book-row-copy';
      const title=document.createElement('strong');title.textContent=book.title;
      const author=document.createElement('span');author.textContent=bookDisplayAuthor(book);
      const badges=document.createElement('small');const audio=book.editions.some(e=>isAudioFormat(e.format)),ebook=book.editions.some(e=>!isAudioFormat(e.format));badges.textContent=[audio?'Audiobook':'',ebook?'E-book':''].filter(Boolean).join(' · ');
      button.setAttribute('aria-label',`${book.title} by ${bookDisplayAuthor(book)} · ${badges.textContent}`);copy.append(title,author,badges);button.append(coverElement(book,this.real),copy);button.addEventListener('click',()=>this.onChoose(book));li.append(button);this.results.append(li);
    }
    if(!matches.length){const empty=document.createElement('li');empty.className='empty-state';empty.textContent='No stories found. Try a different title, author, series, or format.';this.results.append(empty);}
    this.more.hidden=matches.length<=this.limit;this.more.textContent=`Show more (${Math.min(this.limit,matches.length)} of ${matches.length})`;
  }
}
