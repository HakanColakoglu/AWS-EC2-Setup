-- setup.sql
CREATE DATABASE blog;
CREATE ROLE blog_admin WITH LOGIN PASSWORD 'some_password';
GRANT ALL PRIVILEGES ON DATABASE "blog" TO blog_admin;

\c blog

CREATE TABLE blogposts (
    id SERIAL PRIMARY KEY,
    blogheader VARCHAR(255) NOT NULL,
    blogbody TEXT NOT NULL,
    blogauthor VARCHAR(100) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE blogposts TO blog_admin;
GRANT USAGE, SELECT ON SEQUENCE blogposts_id_seq TO blog_admin;