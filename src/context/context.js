import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
    const [githubUser, setGithubUser] = useState(mockUser)
    const [repos, setRepos] = useState(mockRepos)
    const [followers, setFollowers] = useState(mockFollowers);
    const [requests, setRequests] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState({ show: false, msg: '' })

    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                let { rate: { remaining } } = data
                setRequests(remaining)
                if (remaining === 0) {
                    handleError(true, 'Sorry, you have exceed your hourly limit')
                }
            })
            .catch(err => console.log(err))
    }

    function handleError(show, msg) {
        setError({ show, msg })
    }

    const searchGithubUser = async (user) => {
        handleError()
        setIsLoading(true)
        const response = await axios(`${rootUrl}/users/${user}`).catch(error => console.log(error))
        if (response) {
            setGithubUser(response.data)

            const { login, followers_url } = response.data

            await Promise.allSettled([
                axios(`${rootUrl}/users/${login}/repos?per_page=100`),
                axios(`${followers_url}?per_page=100`)
            ]).then((results) => {
                const [repos, followers] = results
                const status = 'fulfilled';
                if (repos.status === status) {
                    setRepos(repos.value.data)
                }
                if (followers.status === status) {
                    setFollowers(followers.value.data)
                }
            })

        } else {
            handleError(true, 'there is no User with that username')
        }
        setIsLoading(false);
        checkRequests();
    }

    useEffect(checkRequests, [])

    return (
        <GithubContext.Provider value={{ githubUser, repos, followers, requests, error, isLoading, searchGithubUser }}>
            {children}
        </GithubContext.Provider>
    )
}

export { GithubContext, GithubProvider }

