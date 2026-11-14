export type Source={title:string;publisher:string;url:string;source_type?:string};
export type TimelineItem={date:string;title:string;detail:string;evidence_status:string};
export type EvidenceItem={id:string;title:string;kind:string;detail:string;status:string;x:number;y:number};
export type CaseFile={id:string;case_number:string;title:string;subtitle:string;country:string;region:string;period:string;category:string;status:string;status_type:string;summary:string;tags:string[];sections:Record<string,string>;timeline:TimelineItem[];evidence:EvidenceItem[];sources:Source[];last_researched:string;editorial_note:string};
export type Scenario={id:string;title:string;difficulty:string;fictional:boolean;brief:string;clues:{title:string;kind:string;body:string}[];question:string;options:string[];answer:number;explanation:string};
