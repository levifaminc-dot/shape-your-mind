import {getCliClient} from 'sanity/cli';
const client=getCliClient({apiVersion:'2026-10-25'}).withConfig({useCdn:false});
// Sanity treats dotted IDs as private paths. Website content needs root IDs.
const documents=await client.fetch('*[_id in path("website.**")]');
if (!documents.length) {console.log('No imported document paths need repair.');process.exit(0);}
const mapping=new Map(documents.map(doc=>[doc._id,doc._id.replaceAll('.','-')]));
function rewrite(value) {
  if (!value || typeof value!=='object') return value;
  if (Array.isArray(value)) return value.map(rewrite);
  return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,key==='_ref'&&mapping.has(item)?mapping.get(item):rewrite(item)]));
}
let transaction=client.transaction();
for (const document of documents) {
  const {_rev,_createdAt,_updatedAt,...fields}=document;
  const next=rewrite(fields);next._id=mapping.get(document._id);
  transaction=transaction.createIfNotExists(next);
}
for (const document of documents) transaction=transaction.delete(document._id);
await transaction.commit();
console.log('Moved '+documents.length+' newly imported documents to public root IDs and preserved their references.');
