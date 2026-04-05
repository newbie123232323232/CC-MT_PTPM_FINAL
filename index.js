const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const authRoute = require('./routes/auth');
const userRoute = require('./routes/users');
const movieRoute = require('./routes/movies');
const listRoute = require('./routes/lists');
const profileRoute = require('./routes/profiles');
const seriesRoute = require('./routes/series');
const seasonRoute = require('./routes/seasons');
const episodeRoute = require('./routes/episodes');
const homeRoute = require('./routes/home');
const catalogRoute = require('./routes/catalog');
const myListRoute = require('./routes/myList');
const playbackRoute = require('./routes/playback');
const historyRoute = require('./routes/history');
const settingsRoute = require('./routes/settings');
const notificationsRoute = require('./routes/notifications');
const downloadsRoute = require('./routes/downloads');
const uploadRoute = require('./routes/upload');
const reviewsRoute = require('./routes/reviews');
const { setSocketServer } = require('./services/realtime');

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful...');
    try {
      require('./services/trendingSchedule').scheduleTrendingRefresh();
    } catch (e) {
      console.error('Trending scheduler:', e);
    }
  })
  .catch((err) => console.log(err));

app.use(express.json());
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET,HEAD,OPTIONS,POST,PUT,DELETE'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Referer, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, token, User-Agent, Authorization'
  );
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  socket.on('auth:user', ({ userId }) => {
    if (userId) socket.join(`user:${String(userId)}`);
  });
  socket.on('auth:profile', ({ profileId }) => {
    if (profileId) socket.join(`profile:${String(profileId)}`);
  });
});
setSocketServer(io);

app.use('/auth', authRoute);
app.use('/users', userRoute);
app.use('/movies', movieRoute);
app.use('/lists', listRoute);
app.use('/profiles', profileRoute);
app.use('/series', seriesRoute);
app.use('/seasons', seasonRoute);
app.use('/episodes', episodeRoute);
app.use('/home', homeRoute);
app.use('/catalog', catalogRoute);
app.use('/my-list', myListRoute);
app.use('/playback', playbackRoute);
app.use('/history', historyRoute);
app.use('/settings', settingsRoute);
app.use('/notifications', notificationsRoute);
app.use('/downloads', downloadsRoute);
app.use('/api/upload', uploadRoute);
app.use('/reviews', reviewsRoute);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Step 1:
app.use(express.static(path.resolve(__dirname, './client/build')));
// Step 2:
app.get('*', function (request, response) {
  response.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
