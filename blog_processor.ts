import { randomInt } from 'crypto';

export function generateValidBlog(title: string, tag: string, category: string, content: string): string {
    let date: Date = new Date();
    let dateStr: string = date.toISOString();
    let id: string = date.getTime().toString() + randomInt(1000).toString();

    let blogHead = `---
title: ${title}
date: ${dateStr}
id: ${id}
tags: ${tag}
categories:
	[${category}]
---`

    let fullBlog = blogHead + "\r\n" + content;
    return fullBlog;
}