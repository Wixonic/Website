import {
	collection,
	getDocs,
	limit,
	orderBy,
	query,
	where
} from "https://www.gstatic.com/firebasejs/{{ path.firebase.version }}/firebase-firestore.js";

import logger from "/script/logger.js";
import { request } from "/script/request.js";
import { db } from "/script/firebase.js";
import { parseDuration } from "/script/utils.js";

/** @typedef {""} ButtonType */

/**
 * @typedef {Object} Button
 * @property {string} content
 * @property {string} link
 * @property {ButtonType} [type]
 */

/**
 * @typedef {Object} Event
 * @property {string} id
 * @property {string} title
 * @property {string} summary
 * @property {Date} startDate
 * @property {Date} [endDate]
 * @property {boolean} pinned
 * @property {Button[]} [buttons]
 * @property {string} [image]
 */

/** @typedef {"Blender" | "Discord" | "GitHub" | "YouTube"} Tag */
/**
 * @typedef {Object} News
 * @property {string} id
 * @property {string} title
 * @property {string} summary
 * @property {Date} date
 * @property {Tag} [tag]
 * @property {boolean} pinned
 * @property {Button[]} [buttons]
 * @property {string} [image]
 */

/** @typedef {"Blender" | "GitHub" | "YouTube"} ProjectType */
/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string} summary
 * @property {Date} date
 * @property {boolean} pinned
 * @property {Button[]} [buttons]
 * @property {string} [image]
 * @property {ProjectType} [type]
 */

addEventListener("DOMContentLoaded", async () => {
	try {
		const pinnedEventsQuery = query(collection(db, "events"), where("pinned", "==", true), orderBy("startDate", "desc"), limit(4));
		const pinnedNewsQuery = query(collection(db, "news"), where("pinned", "==", true), orderBy("date", "desc"), limit(3));
		const pinnedProjectsQuery = query(collection(db, "projects"), where("pinned", "==", true), orderBy("date", "desc"), limit(5));

		const [pinnedEventsSnap, pinnedNewsSnap, pinnedProjectsSnap] = await Promise.all([
			getDocs(pinnedEventsQuery),
			getDocs(pinnedNewsQuery),
			getDocs(pinnedProjectsQuery)
		]);

		/** @type {Event[]} */
		const events = pinnedEventsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
		/** @type {News[]} */
		const news = pinnedNewsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
		/** @type {Project[]} */
		const projects = pinnedProjectsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

		let eventsQuery, newsQuery, projectsQuery = [new Promise(() => { }), new Promise(() => []), new Promise(() => { })];
		if (4 - events.length > 0) eventsQuery = query(collection(db, "events"), where("pinned", "==", false), orderBy("startDate", "desc"), limit(4 - events.length));
		if (3 - news.length > 0) newsQuery = query(collection(db, "news"), where("pinned", "==", false), orderBy("date", "desc"), limit(3 - news.length));
		if (5 - projects.length > 0) projectsQuery = query(collection(db, "projects"), where("pinned", "==", false), orderBy("date", "desc"), limit(5 - projects.length));

		const [eventsSnap, newsSnap, projectsSnap] = await Promise.all([
			getDocs(eventsQuery),
			getDocs(newsQuery),
			getDocs(projectsQuery)
		]);

		events.push(...eventsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
		news.push(...newsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
		projects.push(...projectsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

		const eventContainer = document.querySelector("section.events .content");
		const eventElements = [];
		for (const event of events) {
			const eventElement = document.createElement("article");
			eventElement.classList.add("event");
			if (event.pinned) eventElement.classList.add("pinned");

			const title = document.createElement("h3");
			title.textContent = event.title;
			eventElement.append(title);

			const summary = document.createElement("p");
			summary.classList.add("summary");
			summary.textContent = event.summary;
			eventElement.append(summary);

			eventElements.push(eventElement);
		}
		eventContainer.innerHTML = "";
		eventContainer.append(...eventElements);

		const newsContainer = document.querySelector("section.news .content");
		const newsElements = [];
		for (const newsItem of news) {
			const newsElement = document.createElement("article");
			newsElement.classList.add("news");
			if (newsItem.pinned) newsElement.classList.add("pinned");

			if (newsItem.tag) {
				const tag = document.createElement("div");
				tag.classList.add("tag");
				tag.textContent = newsItem.tag;
				newsElement.append(tag);
			}

			const title = document.createElement("h3");
			title.textContent = newsItem.title;
			newsElement.append(title);

			const summary = document.createElement("p");
			summary.classList.add("content");
			summary.textContent = newsItem.summary;
			newsElement.append(summary);

			newsElements.push(newsElement);
		}
		newsContainer.innerHTML = "";
		newsContainer.append(...newsElements);

		const projectsContainer = document.querySelector("section.projects .content");
		const projectsElements = [];
		for (const project of projects) {
			const projectElement = document.createElement("article");
			projectElement.classList.add("project");
			if (project.pinned) projectElement.classList.add("pinned");

			if (project.type) {
				const tag = document.createElement("div");
				tag.classList.add("project");
				tag.textContent = project.type;
				projectElement.append(tag);

				if (["Blender", "GitHub", "YouTube"].includes(project.type)) tag.classList.add("external");
			}

			const title = document.createElement("h3");
			title.textContent = project.title;
			projectElement.append(title);

			const summary = document.createElement("p");
			summary.classList.add("content");
			summary.textContent = project.summary;
			projectElement.append(summary);

			projectsElements.push(projectElement);
		}
		projectsContainer.innerHTML = "";
		projectsContainer.append(...projectsElements);

		const githubEventsRequest = await request("GET", `https://api.github.com/users/{{ path.github.username }}/events/public?per_page=3`, "json", null, null, 300);
		const githubEvents = githubEventsRequest.response;

		if (githubEventsRequest.status === 200) {
			const commits = githubEvents
				.filter((event) => event.type === "PushEvent" && event.public === true)
				.slice(0, 5);

			const commitContainer = document.querySelector("section.projects article.commits .content");
			const commitElements = [];
			for (const commit of commits) {
				console.log(commit);
				const commitElement = document.createElement("a");
				commitElement.href = `https://github.com/${commit.repo.name}/commit/${commit.payload.head}`;
				commitElement.target = "_blank";
				commitElement.classList.add("commit", "unlink");

				const hashElement = document.createElement("div");
				hashElement.classList.add("hash");
				hashElement.textContent = commit.payload.head.substring(0, 7);
				commitElement.append(hashElement);

				const sourceElement = document.createElement("div");
				sourceElement.classList.add("source");
				sourceElement.textContent = commit.repo.name.replace("{{ path.github.username }}/", "");
				commitElement.append(sourceElement);

				const dateElement = document.createElement("div");
				dateElement.classList.add("date");
				const commitDate = new Date(commit.created_at);
				dateElement.textContent = `${parseDuration(Date.now() - commitDate.getTime())} ago`;
				commitElement.append(dateElement);

				commitElements.push(commitElement);
			}

			commitContainer.innerHTML = "";
			commitContainer.append(...commitElements);
		} else logger.warn("GitHub API request failed", `Status: ${githubEventsRequest.status}`);
	} catch (error) {
		logger.error("Data import failed", error.message, error.stack);
	}
});