---
title: "Lessons from Developing, Publishing, and Maintaining Technical Documentation"
slug: lessons-in-tech-writing
author: Josué Guevara
published: 2025-04-09 
description: "An exploration of technical documentation as a 'literary technology' for knowledge production, examining its role in constructing and stabilizing factual claims, drawing parallels with Bruno Latour's observations."
tags: ["Technical Writing", "Documentation", "Knowledge Production", "Philosophy of Technology", "Bruno Latour", "Literary Technology"]
publish: true
category: ["Writing", "Philosophy"]
datalist: ["author", "published", "category", "tags"]
---


# The Architecture of Technical Knowledge: Lessons from Documentation Practice

## The Literary Technology of Technical Writing

Technical documentation occupies a peculiar position in the ecosystem of knowledge production—simultaneously a product and a process, an artifact and an instrument. Its essence lies not in combat or conquest, but in construction and configuration. Much like Bruno Latour observed in laboratory sciences, technical documentation represents what he called "literary technology"—the means by which factual claims are inscribed, circulated, and stabilized.[^1]

The purpose of this article is to examine the social and material dimensions of technical writing—not merely as a neutral transmission of information, but as a constructed network of inscriptions that create and sustain technical reality. Throughout this exploration, I'll anchor concepts in their proper definitions to provide a rational framework for our discussion.

Let us begin by clarifying what we're discussing. Technical documentation is the result of classifying technical information and imposing an interpretable structure to it. The interpreter or classifier of this information is generally known as a Technical Writer. This documentation serves as both evidence and enabler of technological development and scientific work—a material-semiotic network connecting human and non-human actors.

Technical information itself is the written and symbolic representation of technical insight and scientific knowledge, originating from experimentation within a structured body of work or from general empirical evidence. It exists in myriad forms that Latour might recognize as "inscriptions": experiment logbooks, engineering designs, construction schematics, circuit diagrams, source code, spectroscopy charts, histograms, scatter plots, field drawings, and countless others.

The management of technical documentation borrows concepts from Software Development. When documentation ships alongside a software product, the "Docs-as-Code" paradigm often applies—subjecting documentation production to a schedule parallel to the Software Development Lifecycle while utilizing similar technologies and methods.

## Against the Purification of Technical Content

The greatest misconception in technical writing is the pursuit of universal accessibility through artificial simplification. Many modern guides advocate casting the widest possible net, diluting technical content under the guise of "user-friendliness." Yet this approach fails to acknowledge a fundamental truth that Latour's work illuminates: technical facts are never "pure" or self-evident but are constructed through networks of inscriptions, practices, and institutions.

High-level discussions too often dissolve into storytelling and self-help mantras that plague the tech world. This does a disservice to both writer and reader. The writer's obligation is not to pretend technical information exists in a purified realm separate from its construction, but rather to make visible the processes and networks through which technical knowledge is assembled and stabilized.

There are no one-size-fits-all solutions in technical communication. The technical writer must be specific, deliberate, and cognizant of their audience's needs, which vary wildly across disciplines and contexts. Attempting to please everyone results in documentation that truly satisfies no one and obscures the networks that give technical information its stability and significance.

## The Documentation Lifecycle as Fact Construction

According to established industry manuals, effective quality management in technical documentation follows ideological principles that map well to the DMAIC approach (Define, Measure, Analyze, Improve, and Control).[^2] This structure creates a framework for technical documentation projects:

In Latourian terms, this workflow represents the construction of "immutable mobiles"—stable inscriptions that can travel without losing their shape or meaning. The outline serves as the initial scaffolding for these inscriptions, typically taking the form of a Table of Contents or Index. This navigational aid enables readers to trace routes through the document, much like how scientists use references to establish credibility networks. Entries function like database tuples with attributes including chapter/entry number, section title, and location in the document.

Outlining is also a planning technique analogous to wireframing in UI/UX design. During this process, fundamental questions emerge regarding authorship, function, information sources, structure, tools, design elements, publication pipeline, and maintenance strategy. These questions reflect what Latour might call the "laboratory conditions" of documentation—the material, technological, and social arrangements necessary for producing stable technical inscriptions.

## The Technical Writer's Inscription Devices

The technical writer's toolkit includes several essential components that function as what Latour would call "inscription devices"—technologies that transform matter into written documents:

1. **Technological enablement**: Choosing the right formats (XML, Markdown, etc.) based on compatibility, ease of use, and team requirements—the material conditions of inscription.

2. **Data structuring**: Establishing schemas, metadata, and parsing methods to organize information effectively, creating the grammar of technical inscription.

3. **Change tracking and approval workflow**: Implementing version control systems, CI/CD pipelines, and defined review processes—the social mechanisms that stabilize facts.

4. **Authoring tools**: Selecting appropriate editors, collaboration platforms, preview tools, and output generators—the instruments of inscription.

5. **Documentation repository**: Organizing files with consistent naming conventions, access controls, and backup solutions—the archive that maintains inscriptions over time.

6. **Writing guidelines**: Creating style guides, templates, terminology management systems, and accessibility standards—the conventions that make inscriptions recognizable and repeatable.

7. **Training and onboarding**: Developing materials for team members and establishing feedback loops—the socialization processes that reproduce inscription practices.

8. **Monitoring and maintenance**: Implementing regular updates, error tracking, user feedback collection, and continuous improvement processes—the mechanisms that adapt inscriptions to changing conditions.

9. **Stakeholder involvement**: Ensuring appropriate communication with all relevant parties—the social network that gives inscriptions their authority.

## The DDLC as Circulating Reference

The Technical Documentation Life-Cycle (DDLC) process follows a structured sequence that Latour might describe as a chain of transformations, where each step modifies the inscription while maintaining reference to prior steps:

![[images/tech-docs_light.svg|Technical Documentation Lifecycle|width=500]]

This process can be broken down into specific stages, from document request through final delivery, with contingency paths for handling delays and revisions:

![[images/ddlc_light.svg|Detailed DDLC process|width=500]]

The process begins when a requester initiates a document request. The technical writer then collects information from Subject Matter Experts (SMEs), creates a draft, and manages the review cycle. After incorporating feedback and performing quality checks, the document moves to approval and eventual delivery to the requester. This chain of transformations gradually stabilizes the technical inscription, turning contingent knowledge into something that appears solid and factual.

## The Hybrid Forum of Technical Audiences

As appeasing all audiences simultaneously is futile, technical authors often categorize documentation based on two general assumptions: either the reader possesses previous knowledge about the subject, or they do not. This binary thinking has led to an unfortunate distinction between "technical" and "non-technical" audiences—a distinction that misses what Latour would recognize as the hybrid nature of technical knowledge.

When someone without technical knowledge reads technical content, they are not crossing from a "social" world into a "technical" one—they are entering what Latour might call a "hybrid forum" where technical and social elements are inseparably entangled. By gatekeeping information through unnecessary storytelling and buzzwords, we reinforce an artificial purification between technical and social realms, contradicting technical writing's fundamental purpose. If our focus is readers without prior knowledge, our obligation is to provide interpretive tools that make visible the networks of technical knowledge. If our focus is subject matter experts, we should deliver content that acknowledges and builds upon existing networks.

## The Collective Experiment of Knowledge Transfer

The "curse of knowledge" reflects a common cognitive bias: experts forget what it's like not to know something. Long exposure to a subject creates communication shortcuts that may puzzle newcomers. To counter this pitfall, one must maintain intellectual integrity and avoid arguing over terminology (logomachy).

Latour might view this challenge as part of the broader "collective experiment" of knowledge production and circulation. Technical writers must make visible the otherwise invisible networks that give technical facts their stability:

This approach demands several practices: ensuring navigability through clear document identification; indexing terms, footnotes, lists, figures, and tables; demarcating section boundaries; maintaining specificity and consistency with technical terms; structuring terms and sentences consistently; recognizing that specificity is relative to documentation context; and eliminating buzzwords in favor of plain language with properly introduced acronyms.

## Concepts and Ideas: Matters of Fact vs. Matters of Concern

We must distinguish between concepts and ideas as different rational units. Ideas are historical entities with evolutionary traits that change across time and space. Different disciplines, cultures, and languages approach ideas differently. Ideas like progress, quality, improvement, freedom, and time transcend specific structures.

Concepts, conversely, are category-specific tools providing operational value. A single discipline may contain various concept modulations, or similar terms might designate different concepts. In music, for instance, "time" means something different to a classical musician than to a jazz performer or recording engineer. All represent modulations of a single concept but encapsulate distinct notions.

Latour might describe this distinction in terms of "matters of fact" versus "matters of concern."[^3] Concepts function as matters of fact within their specific domains—operational tools taken as given. Ideas function as matters of concern—contested, evolving entities that gather different actors, interests, and perspectives around them. Technical writing must navigate both, making clear when it is dealing with domain-specific operations versus broader contested terrains.

## Indexation as Actor-Network Building

Indexation—not in the Computer Science sense but as a classificatory practice—establishes valuable relationships between elements and builds "collections" that facilitate information access. An index reveals what its author considered useful information worth quick access. The decision chain in index creation demonstrates experience and insight.

From a Latourian perspective, indexes function as actor-networks, tracing connections between diverse elements and making visible the associations that give technical knowledge its coherence. This classificatory process explains why people from various backgrounds contribute to topics beyond their expertise, enriching target disciplines. It's why a subject like "language" can have hundreds of critical dictionaries with perspectives from philologists, linguists, historians, philosophers, and literature professors.

One of the most massive indexes in existence is Wikipedia's "lists of lists of lists"—a meta-index exemplifying the power of classification and network building across domains.

## Conclusion

Technical writing isn't mere transcription; it's a socio-technical practice of constructing and stabilizing knowledge through inscriptions. By understanding the material and social dimensions of documentation, mastering workflows that produce stable references, and recognizing audience needs within hybrid forums, technical writers can create documentation that genuinely serves its purpose: circulating technical knowledge effectively.

The challenge lies in resisting artificial purification while maintaining clarity—acknowledging the constructed nature of technical facts without undermining their stability. When we accomplish this balancing act, technical documentation fulfills its highest purpose as both evidence and enabler of technological advancement, a crucial node in the network that maintains and extends our collective technical reality.

---

## Works Cited

Bhatti, Jared, Zachary Sarah Corleissen, Jen Lambourne, David Nunez, and Heidi Waterhouse. *Docs for Developers: An Engineer's Field Guide to Technical Writing*. New York: Apress, 2021.

Latour, Bruno and Steve Woolgar. *Laboratory Life: The Construction of Scientific Facts*. Princeton University Press, 1986.

Latour, Bruno. *Science in Action: How to Follow Scientists and Engineers Through Society*. Harvard University Press, 1987.

Maestro, Jesús G. 2017–2022. "El concepto de transducción literaria." In *Crítica de la razón literaria: una Teoría de la Literatura científica, crítica y dialéctica. Tratado de investigación científica, crítica y dialéctica sobre los fundamentos, desarrollos y posibilidades del conocimiento racionalista de la literatura*, III, 4.4.3. Editorial Academia del Hispanismo.

Tokgoz, Emre. *Six Sigma and Quality Concepts for Industrial Engineers*. Synthesis Lectures on Engineering, Science, and Technology. Cham: Springer, 2024.

---

[^1]: Latour, Bruno and Steve Woolgar. *Laboratory Life: The Construction of Scientific Facts*. Princeton University Press, 1986.

[^2]: Tokgoz, Emre. *Six Sigma and Quality Concepts for Industrial Engineers*. Synthesis Lectures on Engineering, Science, and Technology. Cham: Springer, 2024.

[^3]: Latour, Bruno. "Why Has Critique Run out of Steam? From Matters of Fact to Matters of Concern." *Critical Inquiry* 30, no. 2 (2004): 225-248.